/**
 * XY COMBINATOR — Kinetic Editorial system: ink canvas, paper contrast, signal-red intent.
 * Keep global chrome deliberately quiet so the page typography and motion retain the lead.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteLoadingSkeleton } from "@/components/RouteLoadingSkeleton";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { xyOsEnabled } from "./lib/featureFlags";

const Capabilities = lazy(() => import("./pages/Capabilities"));
const Collective = lazy(() => import("./pages/Collective"));
const Contact = lazy(() => import("./pages/Contact"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const People = lazy(() => import("./pages/People"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Projects = lazy(() => import("./pages/Projects"));
const ComponentShowcase = lazy(() => import("./pages/ComponentShowcase"));

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingSkeleton />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/collective" component={Collective} />
          <Route path="/people" component={People} />
          {xyOsEnabled && (
            <Route path="/projects/:slug" component={ProjectDetail} />
          )}
          {xyOsEnabled && <Route path="/projects" component={Projects} />}
          <Route path="/capabilities" component={Capabilities} />
          <Route path="/contact" component={Contact} />
          <Route path="/showcase" component={ComponentShowcase} />
          <Route path="/dashboard/analytics">
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
