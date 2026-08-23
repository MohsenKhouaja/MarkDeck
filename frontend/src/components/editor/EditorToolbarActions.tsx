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
    <div className="flex h-10 w-full flex-shrink-0 items-center justify-between gap-2 rounded-lg border border-border bg-background px-4">
      <div className="flex items-center gap-1">
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
          <Button type="button" size="sm" variant="outline" onClick={onStopEditing} className="h-8 px-3">
            <SquareIcon className="mr-1 size-4" /> Stop editing
          </Button>
        ) : canTakeOver ? (
          <Button type="button" size="sm" variant="outline" onClick={onTakeOverEditing} disabled={!hasCurrentSlide || !canUseRealtime} className="h-8 px-3">
            <PencilIcon className="mr-1 size-4" /> Take over
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={onStartEditing} disabled={!hasCurrentSlide || !canUseRealtime || isLockedBySomeoneElse} className="h-8 px-3">
            <PencilIcon className="mr-1 size-4" /> Start editing
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{lockStatus}</span>
        {isSavedVisible ? (
          <span className="text-xs text-muted-foreground">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
