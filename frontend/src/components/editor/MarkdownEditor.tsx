"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface MarkdownEditorProps {
  markdownDraft: string;
  hasSlides: boolean;
  isEditable: boolean;
  onMarkdownChange: (value: string) => void;
}

export function MarkdownEditor({
  markdownDraft,
  hasSlides,
  isEditable,
  onMarkdownChange,
}: MarkdownEditorProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-primary/10 bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-primary/10 bg-[oklch(0.975_0.008_250)] px-4 py-2.5">
        <p className="text-sm font-semibold">Markdown</p>
        <span className="font-mono text-xs text-muted-foreground">source.md</span>
      </div>
      {!hasSlides ? (
        <Empty className="m-4 border">
          <EmptyHeader>
            <EmptyMedia variant="icon" />
            <EmptyTitle>No slides found</EmptyTitle>
            <EmptyDescription>
              This presentation currently has no slides to edit.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Textarea
          value={markdownDraft}
          onChange={(event) => onMarkdownChange(event.target.value)}
          className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent p-5 font-mono text-sm leading-6 shadow-none focus-visible:ring-0"
          aria-label="Slide markdown content"
          spellCheck={false}
          disabled={!isEditable}
        />
      )}
    </div>
  );
}
