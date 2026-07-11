import { useEffect, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import InstallAppPrompt from '@/components/shared/InstallAppPrompt';

import AppLayout from './components/layout/AppLayout';
// Core coach loop + entry pages stay eager so the pilot flow never shows a chunk
// loading flash: home, auth, dashboard, analyse, reviews, swimmers, settings, shared report.
import HomePage from './pages/public/HomePage';
import ClubOnboarding from './pages/ClubOnboarding';
import ClubSettings from './pages/ClubSettings';
import TeamDashboard from './pages/TeamDashboard.jsx';
import Swimmers from './pages/Swimmers.jsx';
import Analyse from './pages/Analyse';
import SettingsPage from './pages/SettingsPage.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AIReportPage from './pages/AIReportPage';
import AIReportsListPage from './pages/AIReportsListPage';
import SharedReportPage from './pages/SharedReportPage';
// Everything else is code-split: marketing subpages, analytics (recharts), admin/internal
// tools, and the drill library load on demand instead of inside the main bundle.
const FeaturesPage = lazy(() => import('./pages/public/FeaturesPage'));
const ForCoachesPage = lazy(() => import('./pages/public/ForCoachesPage'));
const ForClubsPage = lazy(() => import('./pages/public/ForClubsPage'));
const CoachApprovedAIPage = lazy(() => import('./pages/public/CoachApprovedAIPage'));
const PrivacyVideoReviewPage = lazy(() => import('./pages/public/PrivacyVideoReviewPage'));
const SampleReportPage = lazy(() => import('./pages/public/SampleReportPage'));
const StrokeAnalysisPage = lazy(() => import('./pages/public/StrokeAnalysisPage'));
const BreaststrokeAnalysisPage = lazy(() => import('./pages/public/BreaststrokeAnalysisPage'));
const FreestyleAnalysisPage = lazy(() => import('./pages/public/FreestyleAnalysisPage'));
const BackstrokeAnalysisPage = lazy(() => import('./pages/public/BackstrokeAnalysisPage'));
const ButterflyAnalysisPage = lazy(() => import('./pages/public/ButterflyAnalysisPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const FAQPage = lazy(() => import('./pages/public/FAQPage'));
const ClubProgress = lazy(() => import('./pages/ClubProgress'));
const DrillLibrary = lazy(() => import('./pages/DrillLibrary.jsx'));
const Roadmap = lazy(() => import('./pages/Roadmap.jsx'));
const SwimmerTrends = lazy(() => import('./pages/SwimmerTrends'));
const PerformanceHub = lazy(() => import('./pages/PerformanceHub'));
const AIJobMonitor = lazy(() => import('./pages/AIJobMonitor'));
const AICalibration = lazy(() => import('./pages/AICalibration'));
const AIInfrastructureStatus = lazy(() => import('./pages/AIInfrastructureStatus'));
const FootageChecklist = lazy(() => import('./pages/FootageChecklist'));
const PilotLaunchPage = lazy(() => import('./pages/PilotLaunchPage'));
import { ADMIN_ACCESS_ROLES, COACH_ACCESS_ROLES } from '@/lib/permissions';
import RouteErrorBoundary from '@/components/system/RouteErrorBoundary';
import { useClubContext } from '@/lib/useClubContext';

const COACH_APP_ROLES = COACH_ACCESS_ROLES;
const OWNER_ADMIN_ROLES = ADMIN_ACCESS_ROLES;

// After a deploy, a stale tab requesting an old hashed chunk gets index.html back and the
// dynamic import rejects. Vite emits vite:preloadError for this — reload once to pick up
// the fresh asset manifest instead of stranding the coach on a blank screen. The guard
// prevents a reload loop if the network itself is down.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    const last = Number(sessionStorage.getItem('ssd-chunk-reload-at') || 0);
    if (Date.now() - last < 15000) return; // let the error boundary handle repeat failures
    event.preventDefault();
    sessionStorage.setItem('ssd-chunk-reload-at', String(Date.now()));
    window.location.reload();
  });
}

function AnalyseRoute() {
  const location = useLocation();
  const { club, memberRole } = useClubContext();
  const { user } = useAuth();
  const currentUserRole = memberRole || club?._memberRole || user?.role || 'unknown';

  return (
    <RouteErrorBoundary routeName="Analyse" currentPath={location.pathname} currentUserRole={currentUserRole}>
      <Analyse />
    </RouteErrorBoundary>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const publicWebsitePaths = [
    '/',
    '/features',
    '/for-coaches',
    '/for-clubs',
    '/coach-approved-ai',
    '/privacy-video-review',
    '/sample-report',
    '/stroke-analysis',
    '/stroke-analysis/breaststroke',
    '/stroke-analysis/freestyle',
    '/stroke-analysis/backstroke',
    '/stroke-analysis/butterfly',
    '/pricing',
    '/faq',
  ];
  const isPublicWebsitePath = publicWebsitePaths.includes(location.pathname);

  useEffect(() => {
    if (isPublicWebsitePath) {
      return;
    }

    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex,nofollow');
  }, [isPublicWebsitePath, location.pathname]);

  if (!isPublicWebsitePath && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground">Loading Swim Sight 3D...</span>
        </div>
      </div>
    );
  }

  if (!isPublicWebsitePath && authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    // Boundary above Suspense: a rejected lazy import (or any route render error) shows the
    // recovery card instead of unmounting the whole app to a blank page. Keyed by path so
    // navigating away resets the boundary.
    <RouteErrorBoundary routeName="App" key={location.pathname} currentPath={location.pathname}>
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading page" />
        </div>
      )}
    >
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public website routes — crawlable marketing structure, no app sidebar */}
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/for-coaches" element={<ForCoachesPage />} />
      <Route path="/for-clubs" element={<ForClubsPage />} />
      <Route path="/coach-approved-ai" element={<CoachApprovedAIPage />} />
      <Route path="/privacy-video-review" element={<PrivacyVideoReviewPage />} />
      <Route path="/sample-report" element={<SampleReportPage />} />
      <Route path="/stroke-analysis" element={<StrokeAnalysisPage />} />
      <Route path="/stroke-analysis/breaststroke" element={<BreaststrokeAnalysisPage />} />
      <Route path="/stroke-analysis/freestyle" element={<FreestyleAnalysisPage />} />
      <Route path="/stroke-analysis/backstroke" element={<BackstrokeAnalysisPage />} />
      <Route path="/stroke-analysis/butterfly" element={<ButterflyAnalysisPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/faq" element={<FAQPage />} />

      {/* Public report sharing — only via secure token */}
      <Route path="/shared-report/:token" element={<SharedReportPage />} />

      {/* Public invite landing — membership is created only after authenticated API join */}
      <Route path="/join" element={<ClubOnboarding />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Club onboarding — protected but outside AppLayout (no sidebar, own full-page layout) */}
          <Route path="/club-onboarding" element={<ClubOnboarding />} />

        <Route element={<AppLayout />}>
          <Route path="/settings" element={<SettingsPage />} />

          <Route element={<RoleProtectedRoute allowedRoles={COACH_APP_ROLES} />}>
          {/* Primary coach routes */}
          <Route path="/dashboard" element={<TeamDashboard />} />
          <Route path="/analyse" element={<AnalyseRoute />} />
          <Route path="/ai-reviews" element={<AIReportsListPage />} />
          <Route path="/ai-review" element={<AIReportPage />} />
          <Route path="/swimmers" element={<Swimmers />} />
          {/* Reference Library is parked: its tables (migration 008) are not applied in
              production, so the page would error. Redirect until 008 is intentionally applied. */}
          <Route path="/reference-library" element={<Navigate to="/dashboard" replace />} />
          <Route path="/club-progress" element={<ClubProgress />} />
          <Route path="/swimmer-trends" element={<SwimmerTrends />} />
          <Route path="/performance" element={<PerformanceHub />} />
          {/* Club management */}
          <Route path="/club-settings" element={<ClubSettings />} />
          {/* Legacy migration-era routes — keep old links alive without loading stale pages */}
          <Route path="/report" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/coach-mode" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/drills" element={<Navigate to="/drill-library" replace />} />
          <Route path="/drill-library" element={<DrillLibrary />} />
          <Route path="/pilot-launch" element={<PilotLaunchPage />} />
          {/* Legacy redirects — keep old links working */}
          <Route path="/team-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/ai-reports" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/upload" element={<Navigate to="/analyse" replace />} />
          <Route path="/analysis" element={<Navigate to="/analyse" replace />} />
          <Route path="/setup" element={<Navigate to="/analyse" replace />} />
          <Route path="/branded-report" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/model" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={OWNER_ADMIN_ROLES} />}>
            <Route path="/ai-jobs" element={<AIJobMonitor />} />
            <Route path="/ai-calibration" element={<AICalibration />} />
            <Route path="/ai-infrastructure-status" element={<AIInfrastructureStatus />} />
            <Route path="/footage-checklist" element={<FootageChecklist />} />
            <Route path="/coach-testing" element={<Navigate to="/roadmap" replace />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Route>
          <Route path="/sign-in" element={<Navigate to="/login" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </RouteErrorBoundary>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <InstallAppPrompt />
        </Router>
        <Analytics />
        <SpeedInsights />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
