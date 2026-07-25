import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Workspace from '@/pages/Workspace';
import ExportPage from '@/pages/ExportPage';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/Dashboard';
import SignIn from '@/pages/SignIn';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import WaitlistPage from '@/pages/WaitlistPage';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ClerkAuthProvider } from '@/components/ClerkAuthProvider';
import { AuthGuard } from '@/components/AuthGuard';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/waitlist" component={WaitlistPage} />
      <Route path="/">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route path="/lessons/:id">
        <AuthGuard>
          <Workspace />
        </AuthGuard>
      </Route>
      <Route path="/lessons/:id/export">
        <AuthGuard>
          <ExportPage />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClerkAuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </ClerkAuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
