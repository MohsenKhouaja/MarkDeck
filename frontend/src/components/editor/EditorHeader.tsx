"use client";

import { Link } from "react-router-dom";
import { ArrowLeftIcon, EyeIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditorToolbarProps {
  presentationId: string;
  titleDraft: string;
  isPreviewVisible: boolean;
  canManageAccess: boolean;
  viewHref?: string;
  backHref?: string;
  showBackButton?: boolean;
  onTitleChange: (title: string) => void;
  onTogglePreview: () => void;
  onOpenShare: () => void;
}

export function EditorHeader({
  presentationId,
  titleDraft,
  isPreviewVisible,
  canManageAccess,
  viewHref,
  backHref,
  showBackButton = true,
  onTitleChange,
  onTogglePreview,
  onOpenShare,
}: EditorToolbarProps) {
  return (
    <header className="rounded-xl border border-primary/10 bg-card px-3 py-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showBackButton ? (
            backHref ? (
              <Button asChild variant="ghost" size="sm">
                <Link to={backHref}>
                  <ArrowLeftIcon className="mr-1 size-4" /> Back
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => history.back()}>
                <ArrowLeftIcon className="mr-1 size-4" /> Back
              </Button>
            )
          ) : null}
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={viewHref ?? `/presentations/${presentationId}`}>
              <EyeIcon className="mr-1 size-4" /> View
            </Link>
          </Button>
          <Input
            value={titleDraft}
            onChange={(event) => onTitleChange(event.target.value)}
            className="min-w-32 max-w-md flex-1 border-transparent bg-secondary/55 font-semibold shadow-none hover:border-primary/15 focus-visible:bg-card"
            aria-label="Presentation title"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isPreviewVisible ? "secondary" : "outline"}
            size="sm"
            onClick={onTogglePreview}
          >
            <EyeIcon className="mr-1 size-4" />
            {isPreviewVisible ? "Hide Preview" : "Preview"}
          </Button>
          {canManageAccess ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenShare}
            >
              <Share2Icon className="mr-1 size-4" /> Share
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
