import React from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function PublicReportView({ shareId }) {
  if (shareId) {
    return <Navigate to={`/shared-report/${encodeURIComponent(shareId)}`} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="text-sm font-medium text-foreground mb-1">Report Not Found</div>
        <div className="text-xs text-muted-foreground">This report link is invalid or has been removed.</div>
      </div>
    </div>
  );
}
