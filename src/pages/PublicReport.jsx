import React from 'react';
import PublicReportView from '@/components/reports/PublicReportView';

export default function PublicReport() {
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('id');
  return <PublicReportView shareId={shareId} />;
}