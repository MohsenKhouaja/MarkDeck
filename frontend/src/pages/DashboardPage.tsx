import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileTextIcon,
  Layers3Icon,
  PlusCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  useCreatePresentationMutation,
  useDeletePresentationMutation,
  usePresentationsQuery,
} from "@/hooks/queries/usePresentations";
import { PresentationCard } from "@/components/PresentationCard";

export function DashboardPage() {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const presentationsQuery = usePresentationsQuery();
  const createMutation = useCreatePresentationMutation();
  const deleteMutation = useDeletePresentationMutation();
  const presentations = presentationsQuery.data ?? [];
  const ownedPresentations = presentations.filter(
    (presentation) => presentation.accessLevel === "owner",
  );
  const editablePresentations = presentations.filter(
    (presentation) => presentation.accessLevel === "editor",
  );
  const viewOnlyPresentations = presentations.filter(
    (presentation) => presentation.accessLevel === "viewer",
  );

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    const created = await createMutation
      .mutateAsync({ title: nextTitle })
      .catch(() => undefined);
    if (created) {
      navigate(`/presentations/${created.id}/edit`);
      return;
    }
    setTitle("");
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-6 overflow-hidden rounded-2xl bg-[oklch(0.925_0.03_250)] p-6 md:grid-cols-[1fr_minmax(320px,0.8fr)] md:p-8">
        <div className="flex max-w-xl flex-col justify-center">
          <span className="mb-5 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Layers3Icon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">Turn the next idea into a deck.</h2>
          <p className="mt-3 text-sm leading-6 text-[oklch(0.38_0.045_250)]">
            Start with a title, then build in markdown with your notes, sources, and live slide preview side by side.
          </p>
        </div>

        <form
          onSubmit={onCreate}
          className="flex flex-col justify-center rounded-xl border border-primary/15 bg-card p-5 shadow-sm"
          aria-label="Create presentation form"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <SparklesIcon className="size-4" aria-hidden="true" />
            New presentation
          </div>
          <label htmlFor="presentation-title" className="mb-2 text-sm font-medium">What are you presenting?</label>
          <Input
            id="presentation-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Distributed systems review"
          />
          <Button type="submit" className="mt-3 w-full" disabled={createMutation.isPending || !title.trim()}>
            {createMutation.isPending ? <Spinner /> : <PlusCircleIcon className="size-4" />}
            Create presentation
          </Button>
        </form>
      </section>

      {presentationsQuery.isPending ? (
        <div className="flex items-center gap-2 rounded-xl bg-card p-5 text-sm text-muted-foreground">
          <Spinner /> Loading presentations...
        </div>
      ) : null}

      {presentationsQuery.isSuccess ? (
        <div className="space-y-8">
          <section className="space-y-4" aria-label="Owned presentations">
            <header className="flex items-end justify-between gap-4">
              <div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Your presentations
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Decks you own and control.</p>
              </div>
              <span className="text-sm font-medium text-primary">{ownedPresentations.length} total</span>
            </header>
            {ownedPresentations.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>No owned presentations</EmptyTitle>
                  <EmptyDescription>
                    Create a presentation to see it here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                {ownedPresentations.map((presentation) => (
                  <PresentationCard
                    key={presentation.id}
                    id={presentation.id}
                    title={presentation.title}
                    createdAt={presentation.createdAt}
                    badgeLabel="Owner"
                    badgeVariant="outline"
                    actions={[
                      { type: "link", label: "View", to: `/presentations/${presentation.id}`, variant: "outline" },
                      ...(presentation.capabilities.editContent
                        ? [{ type: "link" as const, label: "Edit", to: `/presentations/${presentation.id}/edit`, variant: "outline" as const }]
                        : []),
                      ...(presentation.capabilities.delete
                        ? [{ type: "button" as const, label: "Delete", onClick: () => deleteMutation.mutate(presentation.id), variant: "destructive" as const, disabled: deleteMutation.isPending }]
                        : []),
                    ]}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4" aria-label="Editable presentations">
            <header>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Shared with you
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Presentations where you can contribute.</p>
            </header>
            {editablePresentations.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>No editable presentations</EmptyTitle>
                  <EmptyDescription>
                    Collaborations with edit access will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                {editablePresentations.map((presentation) => (
                  <PresentationCard
                    key={presentation.id}
                    id={presentation.id}
                    title={presentation.title}
                    createdAt={presentation.createdAt}
                    badgeLabel="Shared edit"
                    badgeVariant="outline"
                    actions={[
                      { type: "link", label: "View", to: `/presentations/${presentation.id}`, variant: "outline" },
                      ...(presentation.capabilities.editContent
                        ? [{ type: "link" as const, label: "Edit", to: `/presentations/${presentation.id}/edit`, variant: "outline" as const }]
                        : []),
                    ]}
                  />
                ))}
              </div>
            )}
          </section>

          {viewOnlyPresentations.length > 0 ? (
            <section className="space-y-4" aria-label="View-only presentations">
              <header>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Shared view-only
                </h3>
              </header>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                {viewOnlyPresentations.map((presentation) => (
                  <PresentationCard
                    key={presentation.id}
                    id={presentation.id}
                    title={presentation.title}
                    createdAt={presentation.createdAt}
                    badgeLabel="Viewer"
                    badgeVariant="outline"
                    actions={[
                      { type: "link", label: "View", to: `/presentations/${presentation.id}`, variant: "outline" },
                    ]}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
