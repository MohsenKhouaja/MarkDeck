import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeProvider";
import { AuthProvider } from "./context/AuthProvider";
import { AppShellLayout } from "./components/app/AppShellLayout";
import {
  AuthenticatedRoute,
  PublicOnlyRoute,
} from "./components/app/RouteGuards";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PresentationViewerPage } from "./pages/PresentationViewerPage";
import { PresentationEditorPage } from "./pages/PresentationEditorPage";
import { SharedPresentationsPage } from "./pages/SharedPresentationsPage";
import { SharedPresentationReadOnlyPage } from "./pages/SharedPresentationReadOnlyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DemoEditorPage } from "./pages/DemoEditorPage";
import { DemoPresentationPage } from "./pages/DemoPresentationPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/demo"
          element={
            <ThemeProvider storage="session" storageKeyPrefix="demo.">
              <DemoEditorPage />
            </ThemeProvider>
          }
        />
        <Route
          path="/demo/present"
          element={
            <ThemeProvider storage="session" storageKeyPrefix="demo.">
              <DemoPresentationPage />
            </ThemeProvider>
          }
        />

        <Route
          path="*"
          element={
            <ThemeProvider>
              <AuthProvider>
                <Routes>
            <Route
              path="/share"
              element={<SharedPresentationReadOnlyPage />}
            />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            <Route element={<AuthenticatedRoute />}>
              <Route element={<AppShellLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/shared" element={<SharedPresentationsPage />} />
              </Route>

              <Route
                path="/presentations/:id"
                element={<PresentationViewerPage />}
              />
              <Route
                path="/presentations/:id/edit"
                element={<PresentationEditorPage />}
              />
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </AuthProvider>
            </ThemeProvider>
          }
        />
      </Routes>
      <Toaster richColors/>
    </BrowserRouter>
  );
}
