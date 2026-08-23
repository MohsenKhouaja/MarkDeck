import type { Server as HttpServer } from "node:http";
import type { UUID } from "node:crypto";
import jsonwebtoken from "jsonwebtoken";
import { Server } from "socket.io";
import { requirePresentationAccess } from "../authorization/presentation-authorization.js";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { db } from "../database/index.js";
import { slideLockStore, type PublicSlideLock } from "./slide-lock-store.js";

type PresentationServerToClientEvents = {
  "locks:snapshot": (payload: { locks: PublicSlideLock[] }) => void;
  "lock:acquired": (payload: { lock: PublicSlideLock }) => void;
  "lock:released": (payload: { lock: PublicSlideLock }) => void;
  "slide:saved": (payload: { slideId: UUID; content: string }) => void;
  "slide:deleted": (payload: { slideId: UUID }) => void;
  "slides:reordered": (payload: Record<string, never>) => void;
  "slides:generated": (payload: Record<string, never>) => void;
  "slide:created": (payload: Record<string, never>) => void;
};

type PresentationClientToServerEvents = {
  "lock:acquire": (
    payload: { slideId?: string },
    callback: (response: LockAcquireResponse) => void,
  ) => void;
  "lock:release": (
    payload: { slideId?: string; lockToken?: string },
    callback?: (response: { ok: boolean }) => void,
  ) => void;
  "lock:takeOver": (
    payload: { slideId?: string },
    callback: (response: LockAcquireResponse) => void,
  ) => void;
};

type PresentationSocketData = {
  userId: UUID;
  username: string;
  presentationId: UUID;
};

type LockAcquireResponse =
  | { ok: true; lock: PublicSlideLock; lockToken: string }
  | { ok: false; code: string; message: string };

type PresentationIo = Server<
  PresentationClientToServerEvents,
  PresentationServerToClientEvents,
  Record<string, never>,
  PresentationSocketData
>;

let io: PresentationIo | null = null;

const presentationRoom = (presentationId: UUID) =>
  `presentation:${presentationId}`;

const readHandshakeString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const toErrorResponse = (error: unknown): { code: string; message: string } => ({
  code:
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "REALTIME_ERROR",
  message: error instanceof Error ? error.message : "Realtime request failed",
});

export function registerPresentationRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true,
    },
    pingInterval: 5_000,
    pingTimeout: 10_000,
  });

  io.use(async (socket, next) => {
    try {
      const token = readHandshakeString(socket.handshake.auth.token);
      const presentationId = readHandshakeString(
        socket.handshake.auth.presentationId,
      ) as UUID | null;

      if (!token || !presentationId) {
        next(new Error("Realtime authentication failed"));
        return;
      }

      const payload = jsonwebtoken.verify(token, config.jwt.accessTokenSecret);
      if (!payload || typeof payload !== "object" || !("sub" in payload)) {
        next(new Error("Realtime authentication failed"));
        return;
      }

      const userId = payload.sub as UUID;
      await requirePresentationAccess(db, {
        userId,
        presentationId,
        action: "editContent",
      });

      const userRow = await db.query.users.findFirst({
        where: { id: userId },
        columns: { username: true },
      });

      socket.data.userId = userId;
      socket.data.username = userRow?.username ?? "Editor";
      socket.data.presentationId = presentationId;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Realtime auth failed"));
    }
  });

  io.on("connection", (socket) => {
    const room = presentationRoom(socket.data.presentationId);
    socket.join(room);
    socket.emit("locks:snapshot", {
      locks: slideLockStore.getPresentationLocks(socket.data.presentationId),
    });

    socket.on("lock:acquire", (payload, callback) => {
      try {
        const slideId = readHandshakeString(payload?.slideId) as UUID | null;
        if (!slideId) {
          callback({ ok: false, code: "SLIDE_ID_REQUIRED", message: "slideId is required" });
          return;
        }

        const lock = slideLockStore.acquire({
          presentationId: socket.data.presentationId,
          slideId,
          userId: socket.data.userId,
          username: socket.data.username,
          socketId: socket.id,
        });
        const publicLock: PublicSlideLock = {
          presentationId: lock.presentationId,
          slideId: lock.slideId,
          userId: lock.userId,
          username: lock.username,
          acquiredAt: lock.acquiredAt,
        };

        io?.to(room).emit("lock:acquired", { lock: publicLock });
        callback({ ok: true, lock: publicLock, lockToken: lock.lockToken });
      } catch (error) {
        callback({ ok: false, ...toErrorResponse(error) });
      }
    });

    socket.on("lock:takeOver", (payload, callback) => {
      try {
        const slideId = readHandshakeString(payload?.slideId) as UUID | null;
        if (!slideId) {
          callback({ ok: false, code: "SLIDE_ID_REQUIRED", message: "slideId is required" });
          return;
        }

        const { released, lock } = slideLockStore.takeOver({
          presentationId: socket.data.presentationId,
          slideId,
          userId: socket.data.userId,
          username: socket.data.username,
          socketId: socket.id,
        });
        const publicLock: PublicSlideLock = {
          presentationId: lock.presentationId,
          slideId: lock.slideId,
          userId: lock.userId,
          username: lock.username,
          acquiredAt: lock.acquiredAt,
        };

        if (released) {
          io?.to(room).emit("lock:released", { lock: released });
        }
        io?.to(room).emit("lock:acquired", { lock: publicLock });
        callback({ ok: true, lock: publicLock, lockToken: lock.lockToken });
      } catch (error) {
        callback({ ok: false, ...toErrorResponse(error) });
      }
    });

    socket.on("lock:release", (payload, callback) => {
      const slideId = readHandshakeString(payload?.slideId) as UUID | null;
      if (!slideId) {
        callback?.({ ok: false });
        return;
      }

      const released = slideLockStore.release({
        presentationId: socket.data.presentationId,
        slideId,
        userId: socket.data.userId,
        socketId: socket.id,
        lockToken: readHandshakeString(payload?.lockToken) ?? undefined,
      });

      if (released) {
        io?.to(room).emit("lock:released", { lock: released });
      }
      callback?.({ ok: Boolean(released) });
    });

    socket.on("disconnect", () => {
      const releasedLocks = slideLockStore.releaseBySocket(socket.id);
      for (const lock of releasedLocks) {
        io?.to(presentationRoom(lock.presentationId)).emit("lock:released", {
          lock,
        });
      }
    });
  });

  logger.info("Presentation realtime server registered");
}

export function assertSlideHttpLock(input: {
  presentationId: UUID;
  slideId: UUID;
  userId: UUID;
  lockToken: string | undefined;
}) {
  slideLockStore.assertHttpLock(input);
}

export function beginExclusivePresentationOperation(presentationId: UUID) {
  return slideLockStore.beginExclusivePresentationOperation(presentationId);
}

export function releaseSlideLock(presentationId: UUID, slideId: UUID) {
  const released = slideLockStore.releaseSlide(presentationId, slideId);
  if (released) {
    io?.to(presentationRoom(presentationId)).emit("lock:released", {
      lock: released,
    });
  }
}

export function releasePresentationUserLock(
  presentationId: UUID,
  userId: UUID,
) {
  const released = slideLockStore.releasePresentationUser(
    presentationId,
    userId,
  );
  if (released) {
    io?.to(presentationRoom(presentationId)).emit("lock:released", {
      lock: released,
    });
  }
}

export function emitSlideSaved(
  presentationId: UUID,
  payload: { slideId: UUID; content: string },
) {
  io?.to(presentationRoom(presentationId)).emit("slide:saved", payload);
}

export function emitSlideDeleted(presentationId: UUID, slideId: UUID) {
  io?.to(presentationRoom(presentationId)).emit("slide:deleted", { slideId });
}

export function emitSlidesReordered(presentationId: UUID) {
  io?.to(presentationRoom(presentationId)).emit("slides:reordered", {});
}

export function emitSlidesGenerated(presentationId: UUID) {
  io?.to(presentationRoom(presentationId)).emit("slides:generated", {});
}

export function emitSlideCreated(presentationId: UUID) {
  io?.to(presentationRoom(presentationId)).emit("slide:created", {});
}
