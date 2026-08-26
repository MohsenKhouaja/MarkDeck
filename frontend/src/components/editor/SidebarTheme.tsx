"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeDropdown } from "@/components/ThemeDropdown";

export function SidebarTheme() {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-xs">
      <h3 className="mb-2 text-sm font-semibold">Slide appearance</h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Choose a canvas theme. Your workspace colors stay consistent.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ThemeToggle />
        <ThemeDropdown />
      </div>
    </div>
  );
}
