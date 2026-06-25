import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary]', this.props.routeName || 'Route', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || 'Unknown route render error';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-3xl border border-red-500/30 bg-red-950/20 p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold">This page crashed while loading</h1>
              <p className="text-sm text-red-100/80">
                Route: {this.props.routeName || 'Unknown route'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 text-sm font-mono text-red-100 overflow-auto">
            {message}
          </div>

          <p className="mt-4 text-sm text-slate-300">
            This is a safe diagnostic screen. It means the navigation route is working, but one component inside this page is throwing a React error.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button onClick={() => window.location.reload()} className="bg-white text-slate-950 hover:bg-slate-200">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = '/dashboard'; }}>
              <Home className="h-4 w-4 mr-2" />
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
