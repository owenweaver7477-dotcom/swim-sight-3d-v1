import { useEffect } from 'react';
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
import InstallAppPrompt from '@/components/shared/InstallAppPrompt';

import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/public/HomePage';
import FeaturesPage from './pages/public/FeaturesPage';
import ForCoachesPage from './pages/public/ForCoachesPage';
import ForClubsPage from './pages/public/ForClubsPage';
import CoachApprovedAIPage from './pages/public/CoachApprovedAIPage';
import PrivacyVideoReviewPage from './pages/public/PrivacyVideoReviewPage';
import SampleReportPage from './pages/public/SampleReportPage';
import StrokeAnalysisPage from './pages/public/StrokeAnalysisPage';
import BreaststrokeAnalysisPage from './pages/public/BreaststrokeAnalysisPage';
import FreestyleAnalysisPage from './pages/public/FreestyleAnalysisPage';
import BackstrokeAnalysisPage from './pages/public/BackstrokeAnalysisPage';
import ButterflyAnalysisPage from './pages/public/ButterflyAnalysisPage';
import PricingPage from './pages/public/PricingPage';
import FAQPage from './pages/public/FAQPage';
import ClubProgress from './pages/ClubProgress';
import ClubOnboarding from './pages/ClubOnboarding';
import ClubSettings from './pages/ClubSettings';
import TeamDashboard from './pages/TeamDashboard.jsx';
import Swimmers from './pages/Swimmers.jsx';
import Analyse from './pages/Analyse';
import ReferenceLibrary from './pages/ReferenceLibrary';
import DrillLibrary from './pages/DrillLibrary.jsx';
import Roadmap from './pages/Roadmap.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AIReportPage from './pages/AIReportPage';
import AIReportsListPage from './pages/AIReportsListPage';
import SharedReportPage from './pages/SharedReportPage';
import SwimmerTrends from './pages/SwimmerTrends';
import TechnicalStandards from './pages/TechnicalStandards';
import PerformanceHub from './pages/PerformanceHub';
import AIJobMonitor from './pages/AIJobMonitor';
import AICalibration from './pages/AICalibration';
import BiomechanicsHUD from './pages/BiomechanicsHUD';

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
          {/* Primary coach routes */}
          <Route path="/dashboard" element={<TeamDashboard />} />
          <Route path="/analyse" element={<Analyse />} />
          <Route path="/ai-reviews" element={<AIReportsListPage />} />
          <Route path="/ai-review" element={<AIReportPage />} />
          <Route path="/swimmers" element={<Swimmers />} />
          <Route path="/reference-library" element={<ReferenceLibrary />} />
          <Route path="/club-progress" element={<ClubProgress />} />
          <Route path="/swimmer-trends" element={<SwimmerTrends />} />
          <Route path="/technical-standards" element={<TechnicalStandards />} />
          <Route path="/performance" element={<PerformanceHub />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Club management */}
          <Route path="/club-settings" element={<ClubSettings />} />
          {/* Legacy migration-era routes — keep old links alive without loading stale pages */}
          <Route path="/report" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/coach-mode" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/drills" element={<Navigate to="/drill-library" replace />} />
          <Route path="/drill-library" element={<DrillLibrary />} />
          <Route path="/ai-jobs" element={<AIJobMonitor />} />
          <Route path="/ai-calibration" element={<AICalibration />} />
          <Route path="/biomechanics-hud" element={<BiomechanicsHUD />} />
          <Route path="/coach-testing" element={<Navigate to="/roadmap" replace />} />
          <Route path="/roadmap" element={<Roadmap />} />
          {/* Legacy redirects — keep old links working */}
          <Route path="/team-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/ai-reports" element={<Navigate to="/ai-reviews" replace />} />
          <Route path="/upload" element={<Navigate to="/analyse" replace />} />
          <Route path="/analysis" element={<Navigate to="/analyse" replace />} />
          <Route path="/setup" element={<Navigate to="/analyse" replace />} />
          <Route path="/branded-report" element={<Navigate to="/report" replace />} />
          <Route path="/model" element={<Navigate to="/reference-library" replace />} />
          <Route path="/sign-in" element={<Navigate to="/login" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
