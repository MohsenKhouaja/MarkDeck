"use client";

import { GripVerticalIcon } from "lucide-react";

interface Slide {
  id: string;
  content: string;
  slideOrder: number;
}

type SlideLock = {
  username: string;
};

interface SlideListProps {
  slides: Slide[];
  selectedSlideIndex: number;
  draggingSlideId: string | null;
  dragOverSlideId: string | null;
  locksBySlideId: Record<string, SlideLock>;
  isGenerating: boolean;
  onSelectSlide: (index: number) => void;
  onDragStart: (slideId: string) => (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDropSlide: (targetId: string) => void;
  onDragOver: (slideId: string) => void;
  onDragLeave: (slideId: string) => void;
}

export function SlideList({
  slides,
  selectedSlideIndex,
  draggingSlideId,
  dragOverSlideId,
  locksBySlideId,
  isGenerating,
  onSelectSlide,
  onDragStart,
  onDragEnd,
  onDropSlide,
  onDragOver,
  onDragLeave,
}: SlideListProps) {
  return (
    <section className="rounded-lg border border-border bg-background">
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Slides</p>
      </div>
      <div className="max-h-[50vh] space-y-1 overflow-y-auto p-2" role="tablist" aria-label="Slides">
        {isGenerating ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <span className="animate-pulse text-xs text-muted-foreground opacity-80">
              Generating slides...
            </span>
          </div>
        ) : slides.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No slides yet</p>
        ) : (
          slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`flex h-10 items-center gap-2 rounded px-2 text-sm text-foreground transition ${
                draggingSlideId === slide.id
                  ? "bg-muted shadow-sm"
                  : index === selectedSlideIndex
                    ? "bg-muted"
                    : "hover:bg-muted/60"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragOverSlideId !== slide.id) onDragOver(slide.id);
              }}
              onDrop={() => void onDropSlide(slide.id)}
              onDragLeave={() => onDragLeave(slide.id)}
            >
              <button
                type="button"
                onClick={() => onSelectSlide(index)}
                className="flex h-8 flex-1 items-center rounded px-1 text-left"
                aria-selected={index === selectedSlideIndex}
                role="tab"
              >
                <span>Slide {index + 1}</span>
                {locksBySlideId[slide.id] ? (
                  <span className="ml-2 truncate text-xs text-muted-foreground">
                    {locksBySlideId[slide.id].username}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                className="flex h-full min-h-9 items-center justify-center rounded-lg border border-border bg-transparent px-3 text-muted-foreground"
                draggable
                onDragStart={onDragStart(slide.id)}
                onDragEnd={onDragEnd}
                aria-label={`Reorder slide ${index + 1}`}
              >
                <GripVerticalIcon className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
