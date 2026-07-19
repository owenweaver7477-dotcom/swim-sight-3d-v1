import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { functions } from '@/lib/data/functions';

const EMPTY_CONSENT = {
  is_minor: false,
  consent_status: 'none',
  guardian_name: '',
  guardian_email: '',
  consent_source: '',
};

export default function SwimmerSafeguardingPanel({ swimmer }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_CONSENT);
  const queryKey = ['swimmer-consent', swimmer?.id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => functions.getSwimmerConsent(swimmer.id),
    enabled: Boolean(swimmer?.id),
    retry: false,
  });

  // functions.getSwimmerConsent returns { data: { consent_record } } (parseResponse
  // wraps the body under `data`) — the extra `.data` here is the fix that made the
  // saved consent actually show, so the panel no longer looks like it "didn't save".
  const savedRecord = data?.data?.consent_record;
  const isRecorded = Boolean(savedRecord?.id);

  useEffect(() => {
    if (!savedRecord) return;
    setForm({
      is_minor: savedRecord.is_minor === true,
      consent_status: savedRecord.consent_status || 'none',
      guardian_name: savedRecord.guardian_name || '',
      guardian_email: savedRecord.guardian_email || '',
      consent_source: savedRecord.consent_source || '',
    });
  }, [savedRecord]);

  const saveConsent = useMutation({
    mutationFn: () => functions.saveSwimmerConsent(swimmer.id, form),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      queryClient.invalidateQueries({ queryKey: ['analysis-swimmer-consent', swimmer?.id] });
      toast.success('Safeguarding record saved');
    },
    onError: (error) => toast.error(error?.message || 'Could not save the safeguarding record.'),
  });

  // Discard: clear the recorded consent back to "not recorded" (keeps the minor flag).
  const discardConsent = useMutation({
    mutationFn: () => functions.saveSwimmerConsent(swimmer.id, {
      ...form, consent_status: 'none', guardian_name: '', guardian_email: '', consent_source: '',
    }),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      queryClient.invalidateQueries({ queryKey: ['analysis-swimmer-consent', swimmer?.id] });
      setForm((current) => ({ ...current, consent_status: 'none', guardian_name: '', guardian_email: '', consent_source: '' }));
      toast.success('Consent discarded');
    },
    onError: (error) => toast.error(error?.message || 'Could not discard the consent record.'),
  });

  const guardianDetailsRequired = form.is_minor && form.consent_status === 'granted';
  const canSave = !guardianDetailsRequired || Boolean(
    form.guardian_name.trim() && form.guardian_email.trim() && form.consent_source
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-labelledby="swimmer-safeguarding-title">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id="swimmer-safeguarding-title" className="text-sm font-bold text-foreground">
              Safeguarding and consent
            </h3>
            {savedRecord?.consent_status === 'granted' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                <Check className="h-3 w-3" /> Recorded
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Record the club's approved consent status before using footage. Policy wording remains a draft until reviewed by a qualified lawyer.
          </p>
        </div>
      </div>

      {isError ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Consent records are currently unavailable. Upload and AI review for minors should remain disabled until migration 018 is confirmed. Other non-sensitive swimmer navigation remains available.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm">
            <Checkbox
              checked={form.is_minor}
              disabled={isLoading || saveConsent.isPending}
              onCheckedChange={(checked) => setForm((current) => ({ ...current, is_minor: checked === true }))}
            />
            <span>Swimmer is recorded as a minor</span>
          </label>

          <div>
            <Label className="text-xs text-muted-foreground">Consent status</Label>
            <Select
              value={form.consent_status}
              onValueChange={(value) => setForm((current) => ({ ...current, consent_status: value }))}
              disabled={isLoading || saveConsent.isPending}
            >
              <SelectTrigger className="mt-1 min-h-11 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not recorded</SelectItem>
                <SelectItem value="granted">Granted</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.is_minor && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Guardian name</Label>
                <Input
                  value={form.guardian_name}
                  onChange={(event) => setForm((current) => ({ ...current, guardian_name: event.target.value }))}
                  className="mt-1 min-h-11 bg-secondary border-border"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Guardian email</Label>
                <Input
                  type="email"
                  value={form.guardian_email}
                  onChange={(event) => setForm((current) => ({ ...current, guardian_email: event.target.value }))}
                  className="mt-1 min-h-11 bg-secondary border-border"
                  autoComplete="email"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Consent source</Label>
                <Select
                  value={form.consent_source || undefined}
                  onValueChange={(value) => setForm((current) => ({ ...current, consent_source: value }))}
                >
                  <SelectTrigger className="mt-1 min-h-11 bg-secondary border-border">
                    <SelectValue placeholder="Select how consent was recorded" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="club_form">Club consent form</SelectItem>
                    <SelectItem value="guardian_email">Guardian email confirmation</SelectItem>
                    <SelectItem value="club_system">Existing club consent system</SelectItem>
                    <SelectItem value="other_documented_source">Other documented source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Guardian contact is restricted to authorised club staff and is excluded from shared reports.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="min-h-11 sm:min-w-32"
                disabled={isLoading || saveConsent.isPending || discardConsent.isPending || !canSave}
                onClick={() => saveConsent.mutate()}
              >
                {saveConsent.isPending
                  ? 'Saving...'
                  : saveConsent.isSuccess
                    ? <><Check className="mr-1 h-3.5 w-3.5" /> Saved</>
                    : isRecorded ? 'Update consent' : 'Save consent'}
              </Button>
              {isRecorded && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11 px-3 text-destructive hover:bg-destructive/10"
                  title="Discard the recorded consent"
                  aria-label="Discard the recorded consent"
                  disabled={isLoading || saveConsent.isPending || discardConsent.isPending}
                  onClick={() => discardConsent.mutate()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
