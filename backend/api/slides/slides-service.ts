import { randomUUID } from "node:crypto";
import type { UUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { requirePresentationAccess } from "../../authorization/presentation-authorization.js";
import type { DBContext } from "../../database/index.js";
import { slides } from "../../database/drizzle/schema.js";
import type { SlideRow } from "../../database/types.js";
import {
  badRequest,
  notFound,
} from "../../errors/http-error.js";
import { aiService } from "../ai/ai-service.js";
import { contextService } from "../contexts/contexts-service.js";

export type slideOrder = {
  id: UUID;
  order: number;
}[];

type SlideCreateInput = {
  content: string;
  slideOrder?: number;
};

const findMany = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
): Promise<SlideRow[]> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "view",
  });

  return await db.query.slides.findMany({
    where: { presentationId },
    orderBy: { slideOrder: "asc" },
  });
};

const findOne = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
  slideId: UUID,
): Promise<SlideRow> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "view",
  });

  const slideRow = await db.query.slides.findFirst({
    where: { id: slideId, presentationId },
  });

  if (!slideRow) {
    throw notFound("Slide not found", "SLIDE_NOT_FOUND");
  }

  return slideRow;
};

const create = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
  input: SlideCreateInput,
): Promise<SlideRow> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "editContent",
  });

  const slideId = randomUUID();

  const maxOrderRow = await db.query.slides.findFirst({
    where: { presentationId },
    columns: { slideOrder: true },
    orderBy: { slideOrder: "desc" },
  });

  const maxOrder = maxOrderRow?.slideOrder ?? 0;

  const nextOrder =
    typeof input.slideOrder === "number" && input.slideOrder > 0
      ? input.slideOrder
      : maxOrder + 1;

  await db.insert(slides).values({
    id: slideId,
    presentationId,
    content: input.content,
    slideOrder: nextOrder,
  });

  return {
    id: slideId,
    presentationId,
    content: input.content,
    slideOrder: nextOrder,
  };
};

const update = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
  slideId: UUID,
  content: string,
): Promise<SlideRow> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "editContent",
  });

  const slideRow = await db.query.slides.findFirst({
    where: { id: slideId, presentationId },
  });

  if (!slideRow) {
    throw notFound("Slide not found", "SLIDE_NOT_FOUND");
  }

  await db
    .update(slides)
    .set({ content })
    .where(
      and(eq(slides.id, slideId), eq(slides.presentationId, presentationId)),
    );

  return {
    id: slideRow.id,
    presentationId: slideRow.presentationId,
    content: content,
    slideOrder: slideRow.slideOrder,
  };
};

const removeOne = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
  slideId: UUID,
): Promise<{ id: UUID; deleted: true }> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "editContent",
  });

  const slideRow = await db.query.slides.findFirst({
    where: { id: slideId, presentationId },
  });

  if (!slideRow) {
    throw notFound("Slide not found", "SLIDE_NOT_FOUND");
  }

  await db.transaction(async (tx) => {
    await tx.delete(slides).where(eq(slides.id, slideId));
    await tx
      .update(slides)
      .set({ slideOrder: sql`${slides.slideOrder} - 1` })
      .where(
        and(
          eq(slides.presentationId, presentationId),
          gt(slides.slideOrder, slideRow.slideOrder ?? 0),
        ),
      );
  });
  return { id: slideId, deleted: true };
};

const updateOrder = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
  firstSlideOrder: slideOrder,
  secondSlideOrder: slideOrder,
): Promise<slideOrder[]> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "editContent",
  });
  if (
    !Array.isArray(firstSlideOrder) ||
    !Array.isArray(secondSlideOrder) ||
    firstSlideOrder.length === 0 ||
    firstSlideOrder.length !== secondSlideOrder.length
  ) {
    throw badRequest(
      "Slide order lists must have the same non-zero length",
      "INVALID_SLIDE_ORDER",
    );
  }
  const firstIds = firstSlideOrder.map((entry) => entry?.id);
  const secondIds = secondSlideOrder.map((entry) => entry?.id);
  const requestedOrders = secondSlideOrder.map((entry) => entry?.order);
  if (
    firstIds.some((id) => typeof id !== "string") ||
    secondIds.some((id) => typeof id !== "string") ||
    requestedOrders.some(
      (order) => !Number.isInteger(order) || Number(order) < 1,
    ) ||
    new Set(firstIds).size !== firstIds.length ||
    new Set(secondIds).size !== secondIds.length ||
    new Set(requestedOrders).size !== requestedOrders.length ||
    firstIds.some((id) => !secondIds.includes(id))
  ) {
    throw badRequest(
      "Slide order entries must contain the same unique IDs and orders",
      "INVALID_SLIDE_ORDER",
    );
  }

  const presentationSlides = await db.query.slides.findMany({
    where: { presentationId, id: { in: firstIds } },
    columns: { id: true },
  });
  if (presentationSlides.length !== firstIds.length) {
    throw notFound("Slide not found", "SLIDE_NOT_FOUND");
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < firstIds.length; index++) {
      await tx
        .update(slides)
        .set({ slideOrder: -(index + 1) })
        .where(
          and(
            eq(slides.id, firstIds[index]),
            eq(slides.presentationId, presentationId),
          ),
        );
    }
    for (const entry of secondSlideOrder) {
      await tx
        .update(slides)
        .set({ slideOrder: entry.order })
        .where(
          and(
            eq(slides.id, entry.id),
            eq(slides.presentationId, presentationId),
          ),
        );
    }
  });
  return [secondSlideOrder];
};

const generateFromContext = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
  contextId: UUID,
  numSlides?: number,
): Promise<SlideRow[]> => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "editContent",
  });

  const presentationRow = await db.query.presentations.findFirst({
    where: { id: presentationId },
    columns: { id: true, title: true },
  });

  if (!presentationRow) {
    throw notFound();
  }

  const contextRow = await contextService.findOne(db, userId, contextId);
  if (!contextRow) {
    throw notFound("Context not found", "CONTEXT_NOT_FOUND");
  }

  if (contextRow.presentationId !== presentationId) {
    throw notFound("Context not found", "CONTEXT_NOT_FOUND");
  }

  const contextPrompt = contextRow.prompt ?? "";
  const contextFiles = Array.isArray(contextRow.files) ? contextRow.files : [];

  if (!contextPrompt.trim() && contextFiles.length === 0) {
    throw badRequest(
      "Presentation context is empty",
      "PRESENTATION_CONTEXT_EMPTY",
    );
  }

  const generated = await aiService.generateSlides({
    title: presentationRow.title,
    contextPrompt,
    files: contextFiles,
    numSlides,
  });

  const createdSlides: SlideRow[] = [];

  await db.transaction(async (tx) => {
    await tx.delete(slides).where(eq(slides.presentationId, presentationId));

    for (let i = 0; i < generated.length; i++) {
      const slideId = randomUUID() as UUID;
      const markdown = generated[i].markdown;
      const slideOrder = i + 1;

      await tx.insert(slides).values({
        id: slideId,
        presentationId,
        content: markdown,
        slideOrder,
      });

      createdSlides.push({
        id: slideId,
        presentationId,
        content: markdown,
        slideOrder,
      });
    }
  });

  return createdSlides;
};

const removeAllByPresentation = async (
  db: DBContext,
  userId: UUID,
  presentationId: UUID,
) => {
  await requirePresentationAccess(db, {
    userId,
    presentationId,
    action: "editContent",
  });
  await db.delete(slides).where(eq(slides.presentationId, presentationId));
};

export const slidesService = {
  findMany,
  findOne,
  create,
  update,
  removeOne,
  removeAllByPresentation,
  generateFromContext,
  updateOrder,
} as const;
