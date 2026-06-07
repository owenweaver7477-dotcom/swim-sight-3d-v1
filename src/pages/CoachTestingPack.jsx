import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { useClubContext } from '@/lib/useClubContext';
import { Button } from '@/components/ui/button';
import { ClipboardList, MessageSquare, Bug, BarChart3, FileText, ShieldAlert, Plus } from 'lucide-react';
import ChecklistTab from '@/components/coach-testing/ChecklistTab';
import FeedbackTab from '@/components/coach-testing/FeedbackTab';
import ReadinessTab from '@/components/coach-testing/ReadinessTab';
import TestScriptTab from '@/components/coach-testing/TestScriptTab';
import BugReportModal from '@/components/coach-testing/BugReportModal';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

const TABS = [
  { key: 'sessions',   label: 'Test Sessions', icon: ClipboardList },
  { key: 'feedback',   label: 'Feedback',       icon: MessageSquare },
  { key: 'bugs',       label: 'Bugs',            icon: Bug },
  { key: 'readiness',  label: 'Readiness',       icon: BarChart3 },
  { key: 'script',     label: 'Test Script',     icon: FileText },
];

export default function CoachTestingPack() {
  const { club, loading } = useClubContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sessions');
  const [showBugModal, setShowBugModal] = useState(false);

  // Owner/admin only guard
  const memberRole = club?._memberRole;
  const isAdminOrOwner = memberRole === 'owner' || memberRole === 'admin';

  if (loading) return null;

  if (!club) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <div className="text-sm font-semibold text-foreground">No club workspace found</div>
      </div>
    );
  }

  if (!isAdminOrOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <div className="text-sm font-bold text-slate-800 mb-1">Access Restricted</div>
        <p className="text-xs text-slate-500">Coach Testing Pack is only accessible to club owners and admins.</p>
        <Button size="sm" variant="outline" className="mt-4 text-xs" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const activeTabDef = TABS.find(t => t.key === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <PageHeader
        eyebrow="Admin · Testing"
        title="Coach Testing Pack"
        subtitle="Structured coach trials, feedback capture, issue tracking, and V1 readiness."
        action={
          <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-500 text-white" onClick={() => setShowBugModal(true)}>
            <Bug className="w-3 h-3 mr-1.5" /> Report Issue
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'sessions'  && <ChecklistTab />}
        {activeTab === 'feedback'  && <FeedbackTab bugMode={false} />}
        {activeTab === 'bugs'      && <FeedbackTab bugMode={true} />}
        {activeTab === 'readiness' && <ReadinessTab />}
        {activeTab === 'script'    && <TestScriptTab />}
      </div>

      {/* Bug report modal */}
      {showBugModal && (
        <BugReportModal
          onClose={() => setShowBugModal(false)}
          defaultRoute="/coach-testing"
        />
      )}

      {/* Floating feedback button */}
      <FeedbackButton pageRoute="/coach-testing" />
    </div>
  );
}