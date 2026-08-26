"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdownRenderer";
import { SlideThemeBoundary } from "@/components/app/SlideThemeBoundary";

interface LivePreviewProps {
  content: string;
  visible: boolean;
}

export function LivePreview({ content, visible }: LivePreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-[oklch(0.94_0.016_250)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Live preview</p>
        <span className="flex items-center gap-1.5 text-xs font-medium text-[oklch(0.38_0.075_155)]"><span className="size-2 rounded-full bg-[var(--color-sage)]" />Synced</span>
      </div>
      <div
        ref={wrapperRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg border border-primary/10 bg-card shadow-xl"
      >
        <div
          className="absolute top-0 left-0 origin-top-left overflow-hidden"
          style={{
            width: 1280,
            height: 720,
            transform: `scale(${scale})`,
          }}
        >
          <SlideThemeBoundary className="h-full w-full p-12">
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <MarkdownRenderer content={content} />
            </div>
          </SlideThemeBoundary>
        </div>
      </div>
    </div>
  );
}
