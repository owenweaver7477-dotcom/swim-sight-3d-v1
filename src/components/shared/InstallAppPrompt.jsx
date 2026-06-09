import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share, X } from 'lucide-react';

const DISMISS_KEY = 'swim_sight_install_prompt_dismissed';

function isStandalone() {
  return window.navigator.standalone === true
    || window.matchMedia?.('(display-mode: standalone)').matches;
}

function isMobileOrTablet() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = window.matchMedia?.('(max-width: 1024px)').matches;
  const iPadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return Boolean((coarse && narrow) || iPadDesktopMode);
}

export default function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    setVisible(!dismissed && !isStandalone() && isMobileOrTablet());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className="fixed left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md rounded-xl border border-cyan-200 bg-white shadow-2xl p-3 print:hidden">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center flex-shrink-0">
          <Share className="w-4 h-4 text-cyan-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900">Install Swim Sight 3D</div>
          <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
            Install Swim Sight 3D: tap Share, then Add to Home Screen.
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 flex-shrink-0"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
