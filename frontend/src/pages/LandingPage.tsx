import { ArrowRightIcon, CheckIcon, PanelsTopLeft } from "lucide-react";
import { AuthForm } from "@/components/authForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main
      className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]"
      aria-labelledby="landing-title"
    >
      <section className="relative overflow-hidden bg-[oklch(0.92_0.032_250)] px-6 py-8 sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-10 xl:px-20">
        <div className="absolute -right-24 top-20 size-80 rounded-full bg-[oklch(0.88_0.045_155)] opacity-70 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <PanelsTopLeft className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold leading-tight">MarkDeck</p>
            <p className="text-xs text-muted-foreground">Markdown to slides</p>
          </div>
        </div>

        <div className="relative z-10 my-16 max-w-2xl lg:my-12">
          <h1
            id="landing-title"
            className="animate-fade-in-up max-w-[12ch] text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl"
            style={{ textWrap: "balance" }}
          >
            Your notes, ready for the room.
          </h1>
          <p
            className="animate-fade-in-up mt-6 max-w-xl text-base leading-7 text-[oklch(0.36_0.045_250)] sm:text-lg"
            style={{ animationDelay: "80ms", textWrap: "pretty" }}
          >
            MarkDeck is an AI-powered, Markdown-first workspace for creating,
            collaborating on, theming, sharing, and presenting polished slide
            decks.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[oklch(0.34_0.05_250)]"
            style={{ animationDelay: "160ms" }}
          >
            {["Markdown-first", "Live preview", "26 slide themes"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-[var(--color-sage-soft)] text-[oklch(0.39_0.08_155)]">
                  <CheckIcon className="size-3" aria-hidden="true" />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 overflow-hidden rounded-2xl border border-primary/15 bg-[oklch(0.985_0.006_250)] shadow-xl">
          <div className="flex items-center justify-between border-b border-primary/10 bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-[var(--color-sage)]" />
              introduction.md
            </div>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">Live preview</span>
          </div>
          <div className="grid md:grid-cols-2">
            <div className="border-b border-primary/10 p-5 font-mono text-sm leading-7 text-[oklch(0.35_0.045_250)] md:border-r md:border-b-0">
              <p><span className="text-primary">#</span> Why ideas spread</p>
              <p className="mt-2"><span className="text-primary">-</span> Start with clarity</p>
              <p><span className="text-primary">-</span> Build a narrative</p>
              <p><span className="text-primary">-</span> End with action</p>
            </div>
            <div className="flex min-h-44 flex-col justify-center bg-[oklch(0.955_0.028_155)] p-6">
              <p className="text-xs font-semibold text-[oklch(0.4_0.075_155)]">IDEA 01</p>
              <p className="mt-3 max-w-[12ch] text-2xl font-semibold leading-tight text-[oklch(0.25_0.045_155)]">Start with clarity.</p>
              <div className="mt-6 h-1 w-12 rounded-full bg-[var(--color-sage)]" />
            </div>
          </div>
        </div>
      </section>

      <section id="auth-form" className="flex min-h-[720px] items-center justify-center px-6 py-14 sm:px-10 lg:min-h-screen lg:px-12" aria-label="Authentication">
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-primary">Your presentation workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Pick up where your ideas started.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Sign in to continue, or create a free account and make your first deck.
          </p>
          <AuthForm />
          <Button asChild variant="ghost" className="mt-4 w-full text-muted-foreground">
            <Link to="/demo">
              Explore the recruiter demo <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
