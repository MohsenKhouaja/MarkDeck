"use client";

import { PencilIcon, PlusIcon, SquareIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type PublicSlideLock = {
  username: string;
};

interface EditorToolbarProps {
  hasCurrentSlide: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isSavedVisible: boolean;
  realtimeStatus: "idle" | "connecting" | "connected" | "disconnected" | "error";
  currentSlideLock: PublicSlideLock | null;
  isEditingCurrentSlide: boolean;
  canTakeOver: boolean;
  onAddSlide: () => void;
  onDeleteSlide: () => void;
  onSave: () => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onTakeOverEditing: () => void;
}

export function EditorToolbar({
  hasCurrentSlide,
  isDeleting,
  isSaving,
  isSavedVisible,
  realtimeStatus,
  currentSlideLock,
  isEditingCurrentSlide,
  canTakeOver,
  onAddSlide,
  onDeleteSlide,
  onSave,
  onStartEditing,
  onStopEditing,
  onTakeOverEditing,
}: EditorToolbarProps) {
  const canUseRealtime = realtimeStatus === "connected";
  const isLockedBySomeoneElse = Boolean(currentSlideLock) && !isEditingCurrentSlide;
  const lockStatus = isEditingCurrentSlide
    ? "Editing"
    : currentSlideLock
      ? `Locked by ${currentSlideLock.username}`
      : realtimeStatus === "connected"
        ? "Ready"
        : "Connecting...";

  return (
    <div className="flex min-h-11 w-full flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-[oklch(0.95_0.016_250)] px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={onAddSlide} className="h-8 px-3">
          <PlusIcon className="mr-1 size-4" /> Add slide
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDeleteSlide} disabled={!isEditingCurrentSlide || isDeleting} className="h-8 px-3">
          <Trash2Icon className="mr-1 size-4" /> Delete slide
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onSave} disabled={!isEditingCurrentSlide || isSaving} className="h-8 px-3">
          {isSaving ? <Spinner className="mr-1 size-4" /> : null}
          Save
        </Button>
        {isEditingCurrentSlide ? (
          <Button type="button" size="sm" variant="secondary" onClick={onStopEditing} className="h-8 px-3">
            <SquareIcon className="mr-1 size-4" /> Stop editing
          </Button>
        ) : canTakeOver ? (
          <Button type="button" size="sm" variant="secondary" onClick={onTakeOverEditing} disabled={!hasCurrentSlide || !canUseRealtime} className="h-8 px-3">
            <PencilIcon className="mr-1 size-4" /> Take over
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" onClick={onStartEditing} disabled={!hasCurrentSlide || !canUseRealtime || isLockedBySomeoneElse} className="h-8 px-3">
            <PencilIcon className="mr-1 size-4" /> Start editing
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3 px-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={`size-2 rounded-full ${realtimeStatus === "connected" ? "bg-[var(--color-sage)]" : "bg-[var(--color-coral)]"}`} />
          {lockStatus}
        </span>
        {isSavedVisible ? (
          <span className="rounded-md bg-[var(--color-sage-soft)] px-2 py-1 text-xs font-medium text-[oklch(0.38_0.075_155)]">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
