"use client";

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon, CalendarDaysIcon, FileTextIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PresentationCardProps {
  id: string;
  title: string;
  createdAt: string;
  badgeLabel: string;
  badgeVariant?: "outline" | "default" | "secondary" | "destructive";
  actions: Array<
    | {
        type: "link";
        label: string;
        to: string;
        variant?: "outline" | "default";
      }
    | {
        type: "button";
        label: string;
        onClick: () => void;
        variant?: "destructive" | "default" | "outline";
        disabled?: boolean;
      }
  >;
  className?: string;
}

export function PresentationCard({
  id,
  title,
  createdAt,
  badgeLabel,
  badgeVariant = "outline",
  actions,
  className,
}: PresentationCardProps) {
  const formattedDate = useMemo(() => new Date(createdAt).toLocaleString(), [createdAt]);
  return (
    <article
      key={id}
      className={cn(
        "group flex flex-col gap-4 px-4 py-4 transition-colors duration-200 hover:bg-secondary/45 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground transition-colors group-hover:bg-[oklch(0.9_0.035_250)]">
          <FileTextIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h4 className="line-clamp-1 font-semibold leading-6">{title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
              {formattedDate}
            </span>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {actions.map((action, index) => {
          if (action.type === "link") {
            return (
              <Button
                key={index}
                asChild
                size="sm"
                variant={action.variant ?? "outline"}
              >
                <Link to={action.to}>
                  {action.label}
                  {action.label !== "Delete" ? <ArrowUpRightIcon className="size-3.5" /> : null}
                </Link>
              </Button>
            );
          }
          return (
            <Button
              key={index}
              size="sm"
              variant={action.variant ?? "destructive"}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label === "Delete" && (
                <Trash2Icon className="mr-1 size-4" />
              )}
              {action.label}
            </Button>
          );
        })}
      </div>
    </article>
  );
}
