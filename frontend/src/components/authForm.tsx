import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/hooks/queries/useAuthSession";
export function AuthForm() {
  const { setEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [formError, setFormError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const activeMutation = mode === "login" ? loginMutation : registerMutation;
  const pending = activeMutation.isPending;
  const changeMode = () => {
    if (mode === "login") {
      setMode("signup");
    } else {
      setMode("login");
    }
  };
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const credentials = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    if (!credentials.email || !credentials.password) {
      setFormError("Email and password are required");
      return;
    }

    setFormError(null);
    const { email, password } = credentials;
    setEmail(email);
    if (mode === "login") {
      await loginMutation
        .mutateAsync({ email, password })
        .catch(() => undefined);
    } else {
      await registerMutation
        .mutateAsync({ email, password })
        .catch(() => undefined);
    }
  };
  return (
    <div className="mt-8 flex w-full items-center justify-center">
      <Tabs
        value={mode}
        onValueChange={changeMode}
        className="flex w-full flex-col"
      >
        <TabsContent value="login" className="flex-1 mt-0">
          <Card className="h-full gap-5 border-primary/10 bg-card shadow-md">
            <CardHeader className="space-y-5">
              <TabsList className="grid w-full shrink-0 grid-cols-2 bg-muted text-sm">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-card data-[state=active]:text-primary"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-card data-[state=active]:text-primary"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your email to sign in to your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit} className="flex-1 flex flex-col">
              <CardContent className="grid gap-4 flex-1">
                <div className="grid gap-2">
                  <Label
                    htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-auto pt-6">
                <div className="w-full space-y-2">
                  {formError ? (
                    <p id="login-error" role="alert" className="text-sm text-destructive">{formError}</p>
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={pending}
                    aria-describedby={formError ? "login-error" : undefined}
                  >
                    {pending ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup" className="flex-1 mt-0">
          <Card className="h-full gap-5 border-primary/10 bg-card shadow-md">
            <CardHeader className="space-y-5">
              <TabsList className="grid w-full shrink-0 grid-cols-2 bg-muted text-sm">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-card data-[state=active]:text-primary"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-card data-[state=active]:text-primary"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Create an account
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit} className="flex-1 flex flex-col">
              <CardContent className="grid gap-4 flex-1">
                <div className="grid gap-2">
                  <Label
                    htmlFor="signup-email"
                    className="text-sm font-medium text-foreground"
                    >
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="signup-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-auto pt-6">
                <div className="w-full space-y-2">
                  {formError ? (
                    <p id="signup-error" role="alert" className="text-sm text-destructive">{formError}</p>
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={pending}
                    aria-describedby={formError ? "signup-error" : undefined}
                  >
                    {pending ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
