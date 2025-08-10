import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import SEOHead from "@/components/seo-head";
import ConversionTracking from "@/components/marketing/conversion-tracking";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import HowItWorks from "@/pages/how-it-works";
import Auth from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import CustomerDashboard from "@/pages/customer-dashboard";
import MerchantDashboard from "@/pages/merchant-dashboard";
import BrowseRequests from "@/pages/browse-requests";
import CreateRequest from "@/pages/create-request";
import IntegrationSetup from "@/pages/integration-setup";
import CopilotDashboard from "@/pages/copilot-dashboard";
import ProfileVerification from "@/pages/profile-verification";
import CustomerProfile from "@/pages/customer-profile";
import MerchantProfile from "@/pages/merchant-profile";
import Messages from "@/pages/messages";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { initializeGlobalVoiceCommands } from "@/lib/voice-commands";
import { initializeGoogleAnalytics } from "@/lib/google-analytics";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && user && !user.userType;

  // Initialize voice commands and analytics when component mounts
  useEffect(() => {
    initializeGlobalVoiceCommands();
    initializeGoogleAnalytics();
  }, []);

  return (
    <div className="min-h-full">
      <SEOHead />
      <ConversionTracking />
      {isAuthenticated && !needsOnboarding && <Header />}
      <Switch>
        {isLoading ? (
          <Route path="*">
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
            </div>
          </Route>
        ) : (
          <>
            {/* Public routes - always accessible */}
            <Route path="/landing" component={Landing} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/auth" component={Auth} />
            
            {/* Root route logic */}
            <Route path="/">
              {!isAuthenticated ? (
                <Landing />
              ) : needsOnboarding ? (
                <Onboarding />
              ) : user?.userType === 'customer' ? (
                <CustomerDashboard />
              ) : (
                <MerchantDashboard />
              )}
            </Route>
            
            {/* Protected routes - redirect to auth if not authenticated */}
            <Route path="/dashboard">
              {!isAuthenticated ? (
                <Auth />
              ) : needsOnboarding ? (
                <Onboarding />
              ) : user?.userType === 'customer' ? (
                <CustomerDashboard />
              ) : (
                <MerchantDashboard />
              )}
            </Route>
            <Route path="/browse">
              {!isAuthenticated ? <Auth /> : <BrowseRequests />}
            </Route>
            <Route path="/create">
              {!isAuthenticated ? <Auth /> : <CreateRequest />}
            </Route>
            <Route path="/integration-setup">
              {!isAuthenticated ? <Auth /> : <IntegrationSetup />}
            </Route>
            <Route path="/copilot-dashboard">
              {!isAuthenticated ? <Auth /> : <CopilotDashboard />}
            </Route>
            <Route path="/profile-verification">
              {!isAuthenticated ? <Auth /> : <ProfileVerification />}
            </Route>
            <Route path="/customer-profile">
              {!isAuthenticated ? <Auth /> : <CustomerProfile />}
            </Route>
            <Route path="/merchant-profile">
              {!isAuthenticated ? <Auth /> : <MerchantProfile />}
            </Route>
            <Route path="/profile">
              {!isAuthenticated ? <Auth /> : user?.userType === 'customer' ? (
                <CustomerProfile />
              ) : (
                <MerchantProfile />
              )}
            </Route>
            <Route path="/messages">
              {!isAuthenticated ? <Auth /> : <Messages />}
            </Route>
            
            <Route component={NotFound} />
          </>
        )}
      </Switch>
      {isAuthenticated && !needsOnboarding && <MobileNav />}
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
