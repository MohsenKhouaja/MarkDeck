import { LayoutDashboard, LogOut, PanelsTopLeft, Share2 } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLogoutMutation } from "@/hooks/queries/useAuthSession";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shared", label: "Shared", icon: Share2 },
] as const;

export function AppShellLayout() {
  const logoutMutation = useLogoutMutation();
  const location = useLocation();
  const currentPage = location.pathname === "/shared" ? "Shared with me" : "My workspace";

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background md:grid-cols-[232px_1fr]">
      <aside className="border-b border-sidebar-border bg-sidebar px-4 py-3 md:border-r md:border-b-0 md:p-4" aria-label="Sidebar">
        <div className="flex items-center justify-between gap-4 md:block">
          <NavLink to="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <PanelsTopLeft className="size-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight">MarkDeck</span>
              <span className="block text-xs text-muted-foreground">Markdown to slides</span>
            </span>
          </NavLink>
        <nav className="flex gap-1 md:mt-8 md:block md:space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-2xs"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/70 px-4 py-3 md:px-8">
          <div>
            <p className="text-sm font-semibold">{currentPage}</p>
            <p className="text-xs text-muted-foreground">Create, refine, and present from one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              aria-label="Logout"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 md:p-8" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
