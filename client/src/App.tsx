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

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    // 檢查網址中是否有 line 參數
    const searchParams = new URLSearchParams(window.location.search);
    const lineParam = searchParams.get('line');
    
    if (lineParam) {
      // 將參數存入 localStorage
      localStorage.setItem('putier_ref_line', lineParam);
      
      // 確保切換路由時，如果有 localStorage 的紀錄，自動補上參數
      // 這裡先簡單儲存，具體的網址補齊會在分享邏輯中處理
    }
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/report/:id" component={Report} />
      <Route path="/records" component={Records} />
      <Route path="/crm" component={CRM} />
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
