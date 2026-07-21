import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AssessmentProvider } from "./contexts/AssessmentContext";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";
import Records from "./pages/Records";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CRM from "./pages/CRM";
import ClientProgressReport from "./pages/ClientProgressReport";

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    // 檢查網址中是否有 line 或 leader_id/ref 參數
    const searchParams = new URLSearchParams(window.location.search);
    const lineParam = searchParams.get('line');
    const leaderIdParam = searchParams.get('leader_id') || searchParams.get('ref');
    
    if (lineParam) {
      localStorage.setItem('putier_ref_line', lineParam);
    }
    if (leaderIdParam) {
      localStorage.setItem('putier_ref_leader_id', leaderIdParam);
    }
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/report/:id" component={Report} />
      <Route path="/records" component={Records} />
      <Route path="/crm" component={CRM} />
      <Route path="/track" component={ClientProgressReport} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AssessmentProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AssessmentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
