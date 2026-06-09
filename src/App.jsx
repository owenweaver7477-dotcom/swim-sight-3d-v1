import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import InstallAppPrompt from '@/components/shared/InstallAppPrompt';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home.jsx';
import ClubProgress from './pages/ClubProgress';
import ClubOnboarding from './pages/ClubOnboarding';
import ClubSettings from './pages/ClubSettings';
import TeamDashboard from './pages/TeamDashboard.jsx';
import Swimmers from './pages/Swimmers.jsx';
import Analyse from './pages/Analyse';
import CoachMode from './pages/CoachMode.jsx';
import ReportPage from './pages/ReportPage';
import ReferenceLibrary from './pages/ReferenceLibrary';
import Drills from './pages/Drills.jsx';
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
import CoachTestingPack from './pages/CoachTestingPack';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground">Loading Swim Sight 3D...</span>
        </div>
      </div>
    );
  }

  if (authError) {
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

      {/* Public landing */}
      <Route path="/" element={<Home />} />

      {/* Public report sharing — only via secure token */}
      <Route path="/shared-report/:token" element={<SharedReportPage />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Club onboarding — protected but outside AppLayout (no sidebar, own full-page layout) */}
          <Route path="/club-onboarding" element={<ClubOnboarding />} />
          {/* Join via invite link — same page, code pre-filled from ?code= param */}
          <Route path="/join" element={<ClubOnboarding />} />

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
          {/* Admin-only pages (still accessible but not in main nav) */}
          <Route path="/report" element={<ReportPage />} />
          <Route path="/coach-mode" element={<CoachMode />} />
          <Route path="/drills" element={<Drills />} />
          <Route path="/drill-library" element={<DrillLibrary />} />
          <Route path="/ai-jobs" element={<AIJobMonitor />} />
          <Route path="/coach-testing" element={<CoachTestingPack />} />
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
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
