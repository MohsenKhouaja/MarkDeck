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
    <header className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {showBackButton ? (
            backHref ? (
              <Button asChild variant="outline" size="sm">
                <Link to={backHref}>
                  <ArrowLeftIcon className="mr-1 size-4" /> Back
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => history.back()}>
                <ArrowLeftIcon className="mr-1 size-4" /> Back
              </Button>
            )
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link to={viewHref ?? `/presentations/${presentationId}`}>
              <EyeIcon className="mr-1 size-4" /> View
            </Link>
          </Button>
          <Input
            value={titleDraft}
            onChange={(event) => onTitleChange(event.target.value)}
            className="max-w-sm"
            aria-label="Presentation title"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePreview}
          >
            <EyeIcon className="mr-1 size-4" />
            {isPreviewVisible ? "Hide Preview" : "Preview"}
          </Button>
          {canManageAccess ? (
            <Button
              variant="outline"
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
