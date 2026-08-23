"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

export type PublicSlideLock = {
  presentationId: string;
  slideId: string;
  userId: string;
  username: string;
  acquiredAt: string;
};

type OwnedSlideLock = {
  slideId: string;
  lockToken: string;
};

type LockAcquireResponse =
  | { ok: true; lock: PublicSlideLock; lockToken: string }
  | { ok: false; code: string; message: string };

type ServerToClientEvents = {
  "locks:snapshot": (payload: { locks: PublicSlideLock[] }) => void;
  "lock:acquired": (payload: { lock: PublicSlideLock }) => void;
  "lock:released": (payload: { lock: PublicSlideLock }) => void;
  "slide:saved": (payload: { slideId: string; content: string }) => void;
  "slide:deleted": (payload: { slideId: string }) => void;
  "slides:reordered": () => void;
  "slides:generated": () => void;
  "slide:created": () => void;
};

type ClientToServerEvents = {
  "lock:acquire": (
    payload: { slideId: string },
    callback: (response: LockAcquireResponse) => void,
  ) => void;
  "lock:takeOver": (
    payload: { slideId: string },
    callback: (response: LockAcquireResponse) => void,
  ) => void;
  "lock:release": (
    payload: { slideId: string; lockToken: string },
    callback?: (response: { ok: boolean }) => void,
  ) => void;
};

type PresentationSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

type UseSlideLocksInput = {
  presentationId: string | null;
  enabled: boolean;
  onSlideSaved: (payload: { slideId: string; content: string }) => void;
  onSlidesChanged: () => void;
};

const emptyLocks: Record<string, PublicSlideLock> = {};

function emitWithAck(
  socket: PresentationSocket,
  eventName: "lock:acquire" | "lock:takeOver",
  slideId: string,
): Promise<LockAcquireResponse> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve({
        ok: false,
        code: "LOCK_REQUEST_TIMEOUT",
        message: "Lock request timed out",
      });
    }, 5_000);

    socket.emit(eventName, { slideId }, (response) => {
      window.clearTimeout(timeout);
      resolve(response);
    });
  });
}

export function useSlideLocks({
  presentationId,
  enabled,
  onSlideSaved,
  onSlidesChanged,
}: UseSlideLocksInput) {
  const { token } = useAuth();
  const socketRef = useRef<PresentationSocket | null>(null);
  const [locksBySlideId, setLocksBySlideId] = useState(emptyLocks);
  const [ownedLock, setOwnedLock] = useState<OwnedSlideLock | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [lastAcquireError, setLastAcquireError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !token || !presentationId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      queueMicrotask(() => {
        setLocksBySlideId(emptyLocks);
        setOwnedLock(null);
        setStatus("idle");
      });
      return;
    }

    queueMicrotask(() => setStatus("connecting"));
    const socket: PresentationSocket = io("/", {
      path: "/socket.io",
      auth: { token, presentationId },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
    });

    socket.on("connect_error", () => {
      setStatus("error");
      setOwnedLock(null);
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
      setOwnedLock(null);
    });

    socket.on("locks:snapshot", ({ locks }) => {
      setLocksBySlideId(
        Object.fromEntries(locks.map((lock) => [lock.slideId, lock])),
      );
    });

    socket.on("lock:acquired", ({ lock }) => {
      setLocksBySlideId((current) => ({
        ...current,
        [lock.slideId]: lock,
      }));
    });

    socket.on("lock:released", ({ lock }) => {
      setLocksBySlideId((current) => {
        const next = { ...current };
        delete next[lock.slideId];
        return next;
      });
      setOwnedLock((current) =>
        current?.slideId === lock.slideId ? null : current,
      );
    });

    socket.on("slide:saved", onSlideSaved);
    socket.on("slide:created", onSlidesChanged);
    socket.on("slide:deleted", onSlidesChanged);
    socket.on("slides:generated", onSlidesChanged);
    socket.on("slides:reordered", onSlidesChanged);

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [enabled, onSlideSaved, onSlidesChanged, presentationId, token]);

  const acquireLock = useCallback(async (slideId: string, takeOver = false) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      const response: LockAcquireResponse = {
        ok: false,
        code: "REALTIME_DISCONNECTED",
        message: "Realtime connection is not available",
      };
      setLastAcquireError(response);
      return response;
    }

    const response = await emitWithAck(
      socket,
      takeOver ? "lock:takeOver" : "lock:acquire",
      slideId,
    );
    if (!response.ok) {
      setLastAcquireError({
        code: response.code,
        message: response.message,
      });
      return response;
    }

    setOwnedLock({ slideId: response.lock.slideId, lockToken: response.lockToken });
    setLastAcquireError(null);
    return response;
  }, []);

  const releaseLock = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket?.connected || !ownedLock) {
      setOwnedLock(null);
      return;
    }

    await new Promise<void>((resolve) => {
      socket.emit(
        "lock:release",
        ownedLock,
        () => resolve(),
      );
      window.setTimeout(resolve, 2_000);
    });
    setOwnedLock(null);
  }, [ownedLock]);

  return {
    locksBySlideId,
    ownedLock,
    status,
    lastAcquireError,
    acquireLock,
    releaseLock,
  };
}
