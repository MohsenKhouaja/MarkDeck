import { AuthForm } from "@/components/authForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main
      className="grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-5 lg:overflow-hidden"
      aria-labelledby="landing-title"
    >
      <section className="col-span-1 border-b px-6 py-8 lg:col-span-3 lg:border-b-0 lg:border-r lg:px-10 lg:py-10 xl:px-16 xl:py-14">
        <div className="relative flex h-full flex-col justify-center lg:min-h-0">
          <div className="relative z-10 max-w-3xl lg:max-w-[31rem] xl:max-w-[35rem]">
            <div
              className="animate-fade-in-up mb-6 h-px w-12 bg-foreground/10"
              style={{ animationDelay: "0ms" }}
            />
            <h1
              id="landing-title"
              className="animate-fade-in-up max-w-3xl text-5xl font-bold leading-[0.9] md:text-7xl lg:text-[5.2rem] xl:text-[5.5rem]"
              style={{ animationDelay: "100ms", textWrap: "balance" }}
            >
              Write markdown.
              <br />
              Present with atmosphere.
            </h1>
            <p
              className="animate-fade-in-up mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
              style={{ animationDelay: "200ms", textWrap: "pretty" }}
            >
              Turn notes into polished slides in seconds. Draft in markdown,
              preview live, and present in a space that feels calm, cinematic,
              and focused.
            </p>

            <div
              className="animate-fade-in-up mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                size="lg"
                onClick={() =>
                  document
                    .getElementById("auth-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get Started Free
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("auth-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Sign In
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/demo">I am a recruiter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section
        id="auth-form"
        className="animate-fade-in-up relative col-span-1 flex items-center justify-center overflow-hidden bg-muted/30 p-6 md:p-10 lg:col-span-2"
        style={{ animationDelay: "500ms" }}
        aria-label="Authentication form"
      >
        <div className="absolute inset-0">
          <img
            src="/image.jpg"
            alt="A luminous open space with a curved veil of light beneath a wide sky."
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="relative z-10 flex w-full items-center justify-center">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
