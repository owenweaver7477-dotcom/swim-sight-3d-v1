import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton({ pageRoute }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-slate-200 shadow-md text-[11px] font-semibold text-slate-600 hover:border-primary/40 hover:text-primary transition-colors print:hidden"
        title="Send feedback"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Feedback
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} pageRoute={pageRoute} />}
    </>
  );
}