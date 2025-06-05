import { Router, Route, Switch } from 'wouter';
import Layout from './components/Layout';
import ClerkSignIn from './components/Auth/ClerkSignIn';
import ClerkSignUp from './components/Auth/ClerkSignUp';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import LandingPage from './components/LandingPage';
import Features from './components/Features';
import FAQ from './components/FAQ';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Contact from './components/Contact';
import ClerkProtectedRoute from './components/Auth/ClerkProtectedRoute';
import { ClerkProvider } from './components/Auth/ClerkProvider';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import NewThread from './components/Dashboard/NewThread';
import NewTweet from './components/Dashboard/NewTweet';
import Analytics from './components/Dashboard/Analytics';
import Settings from './components/Dashboard/Settings';
import Profile from './components/Dashboard/Profile';
import PaymentSuccessPage from './pages/payment-success';
import PaymentCancelPage from './pages/payment-cancel';
import TokenDebugger from './components/Auth/TokenDebugger';
import { ToastContainer } from './src/components/ui/toast-container';

function AppContent() {
  const { isLoaded } = useClerkAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent -z-10"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse-slow"></div>
            <div className="absolute inset-1 bg-black rounded-full"></div>
            <div className="absolute inset-3 border-t-2 border-purple-500 rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mt-4">
            Thread Nova
          </h2>
          <p className="text-gray-400 mt-2">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Router>
        <Switch>
          <Route path="/sign-in">
            <ClerkSignIn />
          </Route>
          
          <Route path="/sign-up">
            <ClerkSignUp />
          </Route>
          
          {/* Handle Clerk SSO callback routes */}
          <Route path="/sign-in/:path*">
            <ClerkSignIn />
          </Route>
          
          <Route path="/sign-up/:path*">
            <ClerkSignUp />
          </Route>
          
          <Route path="/pricing">
            <Pricing />
          </Route>
          
          <Route path="/features">
            <Features />
          </Route>
          
          <Route path="/faq">
            <FAQ />
          </Route>
          
          <Route path="/terms">
            <Terms />
          </Route>
          
          <Route path="/privacy">
            <Privacy />
          </Route>
          
          <Route path="/contact">
            <Contact />
          </Route>
          
          <Route path="/payment-success">
            <PaymentSuccessPage />
          </Route>
          
          <Route path="/payment-cancel">
            <PaymentCancelPage />
          </Route>
          
          <Route path="/debug/token">
            <ClerkProtectedRoute>
              <div className="min-h-screen bg-black py-12">
                <div className="max-w-4xl mx-auto px-4">
                  <h1 className="text-2xl font-bold text-white mb-6">Authentication Debugger</h1>
                  <TokenDebugger />
                </div>
              </div>
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/dashboard/new-thread">
            <ClerkProtectedRoute>
              <NewThread />
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/dashboard/new-tweet">
            <ClerkProtectedRoute>
              <NewTweet />
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/dashboard/analytics">
            <ClerkProtectedRoute>
              <Analytics />
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/dashboard/settings">
            <ClerkProtectedRoute>
              <Settings />
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/dashboard/profile">
            <ClerkProtectedRoute>
              <Profile />
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/dashboard">
            <ClerkProtectedRoute>
              <Dashboard />
            </ClerkProtectedRoute>
          </Route>
          
          <Route path="/">
            <LandingPage />
          </Route>
        </Switch>
      </Router>
      <ToastContainer />
    </Layout>
  );
}

export default function App() {
  return (
    <ClerkProvider>
      <AppContent />
    </ClerkProvider>
  );
} 