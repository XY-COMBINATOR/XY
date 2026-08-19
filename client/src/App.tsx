/**
 * XY COMBINATOR — Kinetic Editorial system: ink canvas, paper contrast, signal-red intent.
 * Keep global chrome deliberately quiet so the page typography and motion retain the lead.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const Capabilities = lazy(() => import("./pages/Capabilities"));
const Collective = lazy(() => import("./pages/Collective"));
const Contact = lazy(() => import("./pages/Contact"));
const People = lazy(() => import("./pages/People"));

function RouteLoading() {
  return <main className="route-loading" aria-live="polite">Loading coordinate…</main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/collective" component={Collective} />
        <Route path="/people" component={People} />
        <Route path="/capabilities" component={Capabilities} />
        <Route path="/contact" component={Contact} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
