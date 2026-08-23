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
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-background">
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
          className="min-h-0 flex-1 resize-none border-0 bg-transparent p-4 font-mono text-sm focus-visible:ring-0"
          aria-label="Slide markdown content"
          spellCheck={false}
          disabled={!isEditable}
        />
      )}
    </div>
  );
}
