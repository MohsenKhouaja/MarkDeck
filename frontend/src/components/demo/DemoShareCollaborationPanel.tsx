import {
  LinkIcon,
  LockIcon,
  PlayIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DemoCollaborationPhase } from "@/components/demo/demoState";

type DemoShareCollaborationPanelProps = {
  open: boolean;
  phase: DemoCollaborationPhase;
  onClose: () => void;
  onReplay: () => void;
};

const phaseCopy: Record<DemoCollaborationPhase, string> = {
  idle: "Run the scene to simulate a second editor in this tab.",
  joining: "Amina opened the shared link.",
  locked: "Amina locked the collaboration slide. Your editor is read-only.",
  updated: "Amina updated the slide and the preview changed.",
  released: "Amina released the lock. Editing is available again.",
};

export function DemoShareCollaborationPanel({
  open,
  phase,
  onClose,
  onReplay,
}: DemoShareCollaborationPanelProps) {
  if (!open) return null;

  return (
    <section
      className="rounded-lg border border-border bg-card p-4"
      data-demo-target="collab"
      aria-label="Demo sharing and collaboration"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Share controls</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sample access only. Demo mode never changes production data.
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close demo sharing controls"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
            Recruiter link
          </span>
          <span className="text-xs text-muted-foreground">Can view</span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <LinkIcon className="size-4 text-muted-foreground" />
            Amina
          </span>
          <span className="text-xs text-muted-foreground">Can edit</span>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-background p-3">
        <div className="flex items-start gap-2">
          <LockIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">One-tab collaboration scene</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {phaseCopy[phase]}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          onClick={onReplay}
          disabled={phase === "joining" || phase === "locked" || phase === "updated"}
        >
          <PlayIcon className="mr-2 size-4" />
          {phase === "released" ? "Replay scene" : "Run scene"}
        </Button>
      </div>
    </section>
  );
}
