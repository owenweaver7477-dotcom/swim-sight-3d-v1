import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function FeedbackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/pilot-readiness')}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-slate-200 shadow-md text-[11px] font-semibold text-slate-600 hover:border-primary/40 hover:text-primary transition-colors print:hidden"
      title="Open pilot feedback"
    >
      <MessageSquare className="w-3.5 h-3.5" />
      Pilot Feedback
    </button>
  );
}
