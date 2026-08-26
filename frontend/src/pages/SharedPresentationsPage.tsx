import { useMemo } from "react";
import { Share2Icon } from "lucide-react";
import { usePresentationsQuery } from "@/hooks/queries/usePresentations";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PresentationCard } from "@/components/PresentationCard";

export function SharedPresentationsPage() {
  const presentationsQuery = usePresentationsQuery();

  const sharedPresentations = useMemo(
    () =>
      (presentationsQuery.data ?? []).filter(
        (presentation) =>
          presentation.accessLevel === "editor" ||
          presentation.accessLevel === "viewer",
      ),
    [presentationsQuery.data],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[oklch(0.93_0.025_155)] p-6 md:p-8">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-[var(--color-sage)] text-white shadow-sm">
          <Share2Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-3xl font-semibold tracking-tight">Shared presentations</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[oklch(0.37_0.045_155)]">
          Presentations shared directly with your account.
        </p>
      </section>

      {presentationsQuery.isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading shared presentations...
        </div>
      ) : null}

      {presentationsQuery.isSuccess && sharedPresentations.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Share2Icon />
            </EmptyMedia>
            <EmptyTitle>No shared presentations</EmptyTitle>
            <EmptyDescription>
              Shared items will appear here once access is granted.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {presentationsQuery.isSuccess && sharedPresentations.length > 0 ? (
        <section
          className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs"
          aria-label="Shared presentations list"
        >
          {sharedPresentations.map((presentation) => (
            <PresentationCard
              key={presentation.id}
              id={presentation.id}
              title={presentation.title}
              createdAt={presentation.createdAt}
              badgeLabel={
                presentation.accessLevel === "editor"
                  ? "Shared editor"
                  : "Shared viewer"
              }
              badgeVariant="outline"
              actions={[
                { type: "link", label: "Viewer", to: `/presentations/${presentation.id}`, variant: "outline" },
                ...(presentation.capabilities.editContent
                  ? [{ type: "link" as const, label: "Edit", to: `/presentations/${presentation.id}/edit`, variant: "default" as const }]
                  : []),
              ]}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
