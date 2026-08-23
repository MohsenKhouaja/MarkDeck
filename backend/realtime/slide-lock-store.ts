import { randomUUID } from "node:crypto";
import type { UUID } from "node:crypto";
import { conflict, forbidden } from "../errors/http-error.js";

export type PublicSlideLock = {
  presentationId: UUID;
  slideId: UUID;
  userId: UUID;
  username: string;
  acquiredAt: string;
};

type SlideLock = PublicSlideLock & {
  socketId: string;
  lockToken: string;
};

type AcquireLockInput = {
  presentationId: UUID;
  slideId: UUID;
  userId: UUID;
  username: string;
  socketId: string;
};

type HttpLockInput = {
  presentationId: UUID;
  slideId: UUID;
  userId: UUID;
  lockToken: string | undefined;
};

const slideKey = (presentationId: UUID, slideId: UUID) =>
  `${presentationId}:${slideId}`;

const userPresentationKey = (presentationId: UUID, userId: UUID) =>
  `${presentationId}:${userId}`;

const toPublicLock = (lock: SlideLock): PublicSlideLock => ({
  presentationId: lock.presentationId,
  slideId: lock.slideId,
  userId: lock.userId,
  username: lock.username,
  acquiredAt: lock.acquiredAt,
});

class SlideLockStore {
  private readonly locksBySlide = new Map<string, SlideLock>();
  private readonly lockKeyByUserPresentation = new Map<string, string>();
  private readonly exclusivePresentationOperations = new Set<UUID>();

  acquire(input: AcquireLockInput): SlideLock {
    if (this.exclusivePresentationOperations.has(input.presentationId)) {
      throw conflict(
        "Presentation is busy",
        "PRESENTATION_OPERATION_IN_PROGRESS",
      );
    }

    const key = slideKey(input.presentationId, input.slideId);
    const existingUserLockKey = this.lockKeyByUserPresentation.get(
      userPresentationKey(input.presentationId, input.userId),
    );
    if (existingUserLockKey) {
      throw conflict(
        "User already holds a lock in this presentation",
        "PRESENTATION_LOCK_ALREADY_HELD",
      );
    }

    const existingSlideLock = this.locksBySlide.get(key);
    if (existingSlideLock) {
      throw conflict("Slide is already locked", "SLIDE_LOCKED");
    }

    const lock: SlideLock = {
      presentationId: input.presentationId,
      slideId: input.slideId,
      userId: input.userId,
      username: input.username,
      socketId: input.socketId,
      lockToken: randomUUID(),
      acquiredAt: new Date().toISOString(),
    };

    this.locksBySlide.set(key, lock);
    this.lockKeyByUserPresentation.set(
      userPresentationKey(input.presentationId, input.userId),
      key,
    );

    return lock;
  }

  takeOver(input: AcquireLockInput): {
    released: PublicSlideLock | null;
    lock: SlideLock;
  } {
    const existingUserLockKey = this.lockKeyByUserPresentation.get(
      userPresentationKey(input.presentationId, input.userId),
    );
    const existingUserLock = existingUserLockKey
      ? this.locksBySlide.get(existingUserLockKey)
      : null;

    if (existingUserLockKey && existingUserLock) {
      this.deleteLock(existingUserLockKey, existingUserLock);
    }

    try {
      return {
        released: existingUserLock ? toPublicLock(existingUserLock) : null,
        lock: this.acquire(input),
      };
    } catch (error) {
      if (existingUserLockKey && existingUserLock) {
        this.locksBySlide.set(existingUserLockKey, existingUserLock);
        this.lockKeyByUserPresentation.set(
          userPresentationKey(input.presentationId, input.userId),
          existingUserLockKey,
        );
      }
      throw error;
    }
  }

  release(input: {
    presentationId: UUID;
    slideId: UUID;
    userId: UUID;
    socketId: string;
    lockToken?: string;
  }): PublicSlideLock | null {
    const key = slideKey(input.presentationId, input.slideId);
    const lock = this.locksBySlide.get(key);
    if (
      !lock ||
      lock.userId !== input.userId ||
      lock.socketId !== input.socketId ||
      (input.lockToken && lock.lockToken !== input.lockToken)
    ) {
      return null;
    }

    this.deleteLock(key, lock);
    return toPublicLock(lock);
  }

  releaseBySocket(socketId: string): PublicSlideLock[] {
    const released: PublicSlideLock[] = [];
    for (const [key, lock] of this.locksBySlide.entries()) {
      if (lock.socketId !== socketId) {
        continue;
      }
      this.deleteLock(key, lock);
      released.push(toPublicLock(lock));
    }
    return released;
  }

  releaseSlide(presentationId: UUID, slideId: UUID): PublicSlideLock | null {
    const key = slideKey(presentationId, slideId);
    const lock = this.locksBySlide.get(key);
    if (!lock) {
      return null;
    }
    this.deleteLock(key, lock);
    return toPublicLock(lock);
  }

  releasePresentationUser(
    presentationId: UUID,
    userId: UUID,
  ): PublicSlideLock | null {
    const key = this.lockKeyByUserPresentation.get(
      userPresentationKey(presentationId, userId),
    );
    const lock = key ? this.locksBySlide.get(key) : null;
    if (!key || !lock) {
      return null;
    }
    this.deleteLock(key, lock);
    return toPublicLock(lock);
  }

  assertHttpLock(input: HttpLockInput): void {
    const lock = this.locksBySlide.get(
      slideKey(input.presentationId, input.slideId),
    );
    if (!lock) {
      throw forbidden("Slide lock is required", "SLIDE_LOCK_REQUIRED");
    }
    if (lock.userId !== input.userId || lock.lockToken !== input.lockToken) {
      throw forbidden("Slide lock is not owned by this request", "SLIDE_LOCK_NOT_OWNED");
    }
  }

  hasPresentationLocks(presentationId: UUID): boolean {
    for (const lock of this.locksBySlide.values()) {
      if (lock.presentationId === presentationId) {
        return true;
      }
    }
    return false;
  }

  beginExclusivePresentationOperation(presentationId: UUID): () => void {
    if (this.exclusivePresentationOperations.has(presentationId)) {
      throw conflict(
        "Presentation operation already in progress",
        "PRESENTATION_OPERATION_IN_PROGRESS",
      );
    }
    if (this.hasPresentationLocks(presentationId)) {
      throw conflict(
        "Presentation has active slide locks",
        "PRESENTATION_HAS_ACTIVE_LOCKS",
      );
    }

    this.exclusivePresentationOperations.add(presentationId);
    return () => {
      this.exclusivePresentationOperations.delete(presentationId);
    };
  }

  getPresentationLocks(presentationId: UUID): PublicSlideLock[] {
    return [...this.locksBySlide.values()]
      .filter((lock) => lock.presentationId === presentationId)
      .map(toPublicLock);
  }

  private deleteLock(key: string, lock: SlideLock) {
    this.locksBySlide.delete(key);
    this.lockKeyByUserPresentation.delete(
      userPresentationKey(lock.presentationId, lock.userId),
    );
  }
}

export const slideLockStore = new SlideLockStore();
