import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import BrowseRequests from "@/pages/browse-requests";
import CreateRequest from "@/pages/create-request";
import Messages from "@/pages/messages";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-full">
      {isAuthenticated && <Header />}
      <Switch>
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/browse" component={BrowseRequests} />
            <Route path="/create" component={CreateRequest} />
            <Route path="/messages" component={Messages} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && <MobileNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
