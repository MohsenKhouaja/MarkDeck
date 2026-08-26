"use client";

import { SparklesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SaveIcon } from "lucide-react";

interface SidebarContextProps {
  activeContextId: string | null;
  effectivePromptDraft: string;
  pendingFiles: File[];
  contextFiles: { id: string; originalName: string; fileName: string }[] | undefined;
  isUpdating: boolean;
  isGenerating: boolean;
  numSlides: string;
  onPromptChange: (value: string) => void;
  onPickFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePendingFile: (file: File) => void;
  onMarkFileForDeletion: (fileId: string) => void;
  onSaveContext: (event: React.FormEvent) => void;
  onGenerateSlides: () => void;
  onNumSlidesChange: (value: string) => void;
}

export function SidebarContext({
  activeContextId,
  effectivePromptDraft,
  pendingFiles,
  contextFiles,
  isUpdating,
  isGenerating,
  numSlides,
  onPromptChange,
  onPickFiles,
  onRemovePendingFile,
  onMarkFileForDeletion,
  onSaveContext,
  onGenerateSlides,
  onNumSlidesChange,
}: SidebarContextProps) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-secondary text-secondary-foreground"><SparklesIcon className="size-3.5" /></span>
        <h3 className="text-sm font-semibold">Source context</h3>
      </div>
      <form onSubmit={onSaveContext} className="space-y-3">
        <Textarea
          value={effectivePromptDraft}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="What should this presentation cover?"
          rows={6}
          aria-label="Context prompt"
          className="max-h-64 overflow-y-auto resize-y"
        />
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="context-files">Files</label>
          <Input id="context-files" type="file" multiple onChange={onPickFiles} aria-describedby="context-files-help" />
          <p id="context-files-help" className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, PNG, JPG</p>
        </div>
        <div className="space-y-2">
          {contextFiles?.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
              <span className="line-clamp-1">{file.originalName}</span>
              <Button size="icon" variant="ghost" type="button" onClick={() => onMarkFileForDeletion(file.id)} aria-label={`Mark ${file.originalName} for deletion`}>
                <XIcon className="size-3" />
              </Button>
            </div>
          ))}
          {pendingFiles.map((file) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
              <span className="line-clamp-1">{file.name}</span>
              <Button size="icon" variant="ghost" type="button" onClick={() => onRemovePendingFile(file)} aria-label={`Remove ${file.name}`}>
                <XIcon className="size-3" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="submit" variant="secondary" className="w-full" disabled={isUpdating}>
          {isUpdating ? <Spinner className="mr-2" /> : <SaveIcon className="mr-2 size-4" />}
          Save Context
        </Button>
      </form>

      <Separator className="my-4" />

      <div className="space-y-2">
        <p className="text-sm font-semibold">Generate slides</p>
        <Input
          type="number" min={1} max={50} placeholder="Number of slides" value={numSlides}
          onChange={(e) => onNumSlidesChange(e.target.value)}
        />
        <Button
          type="button" onClick={onGenerateSlides}
          className="w-full"
          disabled={!activeContextId || isGenerating}
        >
          <SparklesIcon className="mr-2 size-4" />
          {isGenerating ? "Generating..." : "Generate slides"}
        </Button>
      </div>
    </div>
  );
}
