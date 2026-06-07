import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Brain, CheckCircle2, BarChart3, Users, ArrowRight } from 'lucide-react';

const STEPS = [
  { icon: Users,        label: 'Add Swimmer',    sub: 'Create swimmer profiles',   link: '/swimmers' },
  { icon: Upload,       label: 'Upload Video',   sub: 'Select stroke and angle',   link: '/analyse' },
  { icon: Brain,        label: 'AI Review',      sub: 'Approve findings',          link: '/ai-reviews' },
  { icon: CheckCircle2, label: 'Finalise Report',sub: 'Lock and export',           link: '/ai-reviews' },
  { icon: BarChart3,    label: 'Track Progress', sub: 'Club-wide analytics',       link: '/performance' },
];

export default function WorkflowGuide() {
  return (
    <div className="mb-6 p-4 rounded-xl bg-secondary/40 border border-border">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recommended Workflow</div>
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              <Link to={step.link} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group">
                <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors">{step.label}</div>
                  <div className="text-[9px] text-muted-foreground">{step.sub}</div>
                </div>
              </Link>
              {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}