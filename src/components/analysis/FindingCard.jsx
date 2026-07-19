import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { SEVERITY_LEVELS } from '@/lib/swimState';
import entities from '@/lib/data/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function FindingCard({ finding }) {
  const queryClient = useQueryClient();
  const severity = SEVERITY_LEVELS.find(s => s.value === finding.severity);

  const deleteFinding = useMutation({
    mutationFn: () => entities.Finding.delete(finding.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['findings'] }),
  });

  return (
    <div className="p-3 rounded-lg bg-secondary border border-border">
      <div className="flex items-start justify-between mb-1">
        <div className="text-xs font-semibold text-foreground">{finding.finding_name}</div>
        <span className={`text-[10px] font-medium ${severity?.color || 'text-muted-foreground'}`}>
          {severity?.label || finding.severity}
        </span>
      </div>
      {finding.phase && <div className="text-[10px] text-muted-foreground mb-1">Phase: {finding.phase}</div>}
      {finding.cue && (
        <div className="text-[10px] text-primary mt-1">
          Cue: {finding.cue}
        </div>
      )}
      {finding.drill && (
        <div className="text-[10px] text-muted-foreground">
          Drill: {finding.drill}
        </div>
      )}
      <div className="flex gap-1 mt-2">
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => deleteFinding.mutate()}>
          <Trash2 className="w-3 h-3" /> Delete
        </Button>
      </div>
    </div>
  );
}
