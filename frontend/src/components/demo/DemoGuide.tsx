import {
  CheckIcon,
  GithubIcon,
  PanelRightOpenIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DEMO_GUIDE_ITEMS, type DemoGuideItemId } from "@/components/demo/demoState";

type DemoGuideProps = {
  completedItems: Record<DemoGuideItemId, boolean>;
  onSelectItem: (itemId: DemoGuideItemId) => void;
  onReset: () => void;
};

const sourceUrl =
  "https://github.com/MohsenKhouaja/AI-Powered-Presentation-Generator";

export function DemoGuide({
  completedItems,
  onSelectItem,
  onReset,
}: DemoGuideProps) {
  const completedCount = DEMO_GUIDE_ITEMS.filter(
    (item) => completedItems[item.id],
  ).length;

  return (
    <aside className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Recruiter demo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Four actions, about one minute. No login, no backend writes.
          </p>
        </div>
        <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
          {completedCount}/4
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {DEMO_GUIDE_ITEMS.map((item) => {
          const isComplete = completedItems[item.id];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item.id)}
              className="flex w-full gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-xs ${
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
                aria-hidden="true"
              >
                {isComplete ? <CheckIcon className="size-3.5" /> : null}
              </span>
              <span>
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2">
        <Button asChild size="sm">
          <Link to="/demo/present">
            <PanelRightOpenIcon className="mr-2 size-4" />
            Present deck
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            <GithubIcon className="mr-2 size-4" />
            View source
          </a>
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onReset}>
          <RotateCcwIcon className="mr-2 size-4" />
          Reset demo
        </Button>
      </div>
    </aside>
  );
}
