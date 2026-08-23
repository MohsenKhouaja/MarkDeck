import { Router } from "express";
import type { UUID } from "node:crypto";
import { db } from "../../database/index.js";
import { badRequest } from "../../errors/http-error.js";
import { releasePresentationUserLock } from "../../realtime/presentation-realtime.js";
import { accessService, type GrantPermission } from "./presentations_access-service.js";

export const presentationsAccessRouter = Router();
export const publicPresentationShareRouter = Router();

const parseOptionalFutureDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw badRequest(
      "expiresAt must be an ISO date string or null",
      "INVALID_ACCESS_EXPIRY",
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    throw badRequest(
      "expiresAt must be a future date",
      "INVALID_ACCESS_EXPIRY",
    );
  }
  return parsed;
};

presentationsAccessRouter.get("/presentations/:id/access", async (req, res) => {
  const grants = await accessService.listGrants(
    db,
    req.authenticatedUserId as UUID,
    req.params.id as UUID,
  );
  res.json(grants);
});

presentationsAccessRouter.post(
  "/presentations/:id/access",
  async (req, res) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const permission = req.body?.permission as GrantPermission | undefined;
    if (!email) {
      throw badRequest("Email is required", "EMAIL_REQUIRED");
    }
    if (permission !== "viewer" && permission !== "editor") {
      throw badRequest(
        "permission must be viewer or editor",
        "INVALID_ACCESS_PERMISSION",
      );
    }

    const grant = await accessService.grantAccess(
      db,
      req.authenticatedUserId as UUID,
      req.params.id as UUID,
      {
        email,
        permission,
        expiresAt: parseOptionalFutureDate(req.body?.expiresAt),
      },
    );
    if (grant.permission !== "editor") {
      releasePresentationUserLock(req.params.id as UUID, grant.user.id as UUID);
    }
    res.status(201).json(grant);
  },
);

presentationsAccessRouter.delete(
  "/presentations/:id/access/:grantId",
  async (req, res) => {
    const grants = await accessService.listGrants(
      db,
      req.authenticatedUserId as UUID,
      req.params.id as UUID,
    );
    const grant = grants.find((candidate) => candidate.id === req.params.grantId);
    await accessService.removeGrant(
      db,
      req.authenticatedUserId as UUID,
      req.params.id as UUID,
      req.params.grantId as UUID,
    );
    if (grant?.user) {
      releasePresentationUserLock(
        req.params.id as UUID,
        grant.user.id as UUID,
      );
    }
    res.status(204).end();
  },
);

presentationsAccessRouter.get(
  "/presentations/:id/share-link",
  async (req, res) => {
    res.json(
      await accessService.getShareLinkStatus(
        db,
        req.authenticatedUserId as UUID,
        req.params.id as UUID,
      ),
    );
  },
);

presentationsAccessRouter.post(
  "/presentations/:id/share-link",
  async (req, res) => {
    const result = await accessService.createOrRotateShareLink(
      db,
      req.authenticatedUserId as UUID,
      req.params.id as UUID,
      parseOptionalFutureDate(req.body?.expiresAt),
    );
    res.status(201).json(result);
  },
);

presentationsAccessRouter.delete(
  "/presentations/:id/share-link",
  async (req, res) => {
    await accessService.revokeShareLink(
      db,
      req.authenticatedUserId as UUID,
      req.params.id as UUID,
    );
    res.status(204).end();
  },
);

publicPresentationShareRouter.get("/presentation", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const token = req.header("X-Share-Token") ?? "";
  const presentation = await accessService.getPublicPresentation(db, token);
  res.json(presentation);
});
