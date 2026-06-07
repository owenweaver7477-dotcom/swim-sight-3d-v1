import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function TestAICallbackHelper({ upload, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const runTestCallback = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('runTestAICallback', {
        video_upload_id: upload.id,
      });

      if (res.data?.success) {
        setResult({ ok: true, report_id: res.data.report_id, findings: res.data.findings_created });
        queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
        queryClient.invalidateQueries({ queryKey: ['ai-reports'] });
        onComplete && onComplete();
      } else {
        setResult({ ok: false, message: res.data?.error || 'Unknown error' });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to run test';
      setResult({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-green-400 bg-green-900/10 border border-green-700/20 rounded-lg px-3 py-2">
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        Test AI report created · {result.findings} findings ingested
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full border-yellow-700/30 text-yellow-400 hover:bg-yellow-900/20"
        onClick={runTestCallback}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Simulating AI…</>
        ) : (
          <><FlaskConical className="w-3 h-3 mr-1" /> Create Test AI Result</>
        )}
      </Button>
      {result?.ok === false && (
        <div className="text-[10px] text-destructive px-1">{result.message}</div>
      )}
    </div>
  );
}