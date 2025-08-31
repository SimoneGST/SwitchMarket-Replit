import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "@/components/layout/toast-container";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import SEOHead from "@/components/seo-head";
import ConversionTracking from "@/components/marketing/conversion-tracking";

import Landing from "@/pages/landing";
import HowItWorks from "@/pages/how-it-works";
import Auth from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import CustomerDashboard from "@/pages/customer-dashboard";
import MerchantDashboard from "@/pages/merchant-dashboard";
import MerchantBrowse from "@/pages/merchant-browse";
import CreateRequest from "@/pages/create-request";
import SupplierSearchPage from "@/pages/supplier-search";
import IntegrationSetup from "@/pages/integration-setup";
import CopilotDashboard from "@/pages/copilot-dashboard";
import ProfileVerification from "@/pages/profile-verification";
import CustomerProfile from "@/pages/customer-profile";
import MerchantProfile from "@/pages/merchant-profile";
import Messages from "@/pages/messages";
import MerchantVerification from "@/pages/merchant-verification";
import StoreShowcase from "@/pages/store-showcase";
import ProductForm from "@/pages/product-form";
import MerchantIntegrations from "@/pages/merchant-integrations";
import LeonardoCopilot from "@/pages/leonardo-copilot";
import LeonardoProfileSetup from "@/pages/leonardo-profile-setup";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { initializeGlobalVoiceCommands } from "@/lib/voice-commands";
import { initializeGoogleAnalytics } from "@/lib/google-analytics";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { setupGlobalErrorHandling } from "@/lib/globalErrorHandler";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && user && !user.userType;

  // Initialize voice commands, analytics and error handling when component mounts
  useEffect(() => {
    initializeGlobalVoiceCommands();
    initializeGoogleAnalytics();
    setupGlobalErrorHandling();
  }, []);

  return (
    <div className="min-h-full pb-20 md:pb-0">
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
              {!isAuthenticated ? (
                <Auth />
              ) : user?.userType === 'merchant' ? (
                <MerchantBrowse />
              ) : (
                <CustomerDashboard />
              )}
            </Route>
            <Route path="/create">
              {!isAuthenticated ? <Auth /> : user?.userType === 'customer' ? (
                <CreateRequest />
              ) : (
                <SupplierSearchPage />
              )}
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
            <Route path="/merchant-verification">
              {!isAuthenticated ? <Auth /> : <MerchantVerification />}
            </Route>
            <Route path="/store-showcase">
              {!isAuthenticated ? <Auth /> : <StoreShowcase />}
            </Route>
            <Route path="/product/add">
              {!isAuthenticated ? <Auth /> : <ProductForm />}
            </Route>
            <Route path="/product/edit/:id">
              {(params) => !isAuthenticated ? <Auth /> : <ProductForm productId={(params as any).id} />}
            </Route>
            <Route path="/merchant-integrations">
              {!isAuthenticated ? <Auth /> : <MerchantIntegrations />}
            </Route>
            <Route path="/leonardo-copilot">
              {!isAuthenticated ? <Auth /> : <LeonardoCopilot />}
            </Route>
            <Route path="/leonardo-profile-setup">
              {!isAuthenticated ? <Auth /> : <LeonardoProfileSetup />}
            </Route>
          </>
        )}
      </Switch>
      {isAuthenticated && !needsOnboarding && <MobileNav />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ToastContainer />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
