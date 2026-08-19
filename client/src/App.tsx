/**
 * XY COMBINATOR — Kinetic Editorial system: ink canvas, paper contrast, signal-red intent.
 * Keep global chrome deliberately quiet so the page typography and motion retain the lead.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Capabilities from "./pages/Capabilities";
import Collective from "./pages/Collective";
import Contact from "./pages/Contact";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import People from "./pages/People";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/collective" component={Collective} />
      <Route path="/people" component={People} />
      <Route path="/capabilities" component={Capabilities} />
      <Route path="/contact" component={Contact} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
