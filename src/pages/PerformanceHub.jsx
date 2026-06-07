import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { BarChart3, TrendingUp, Trophy, Waves, Award, Zap, ArrowRight, Loader2 } from 'lucide-react';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';

const HUB_CARDS = [
  {
    to: '/club-progress',
    icon: BarChart3,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Club Progress',
    description: 'Track coach-approved technical trends, fault frequency, and phase scores across the club.',
    metric: null,
  },
  {
    to: '/swimmer-trends',
    icon: TrendingUp,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Swimmer Trends',
    description: 'View individual technique score and drag-risk trends over time.',
    metric: null,
  },
  {
    to: '/club-progress',
    icon: Trophy,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Team Leaderboard',
    description: 'Compare technical improvement, review consistency, and severity reduction across swimmers.',
    metric: null,
  },
  {
    to: '/technical-standards',
    icon: Award,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Technical Standards',
    description: "Define and manage your club's stroke-phase technical model. Link standards to findings and reports.",
    metric: null,
  },
  {
    to: '/club-progress',
    icon: Zap,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Drag Risk Priorities',
    description: 'Review coach-approved hydrodynamic risk observations and high-priority drag findings across the squad.',
    metric: null,
  },
];

function HubCard({ card, metric }) {
  const navigate = useNavigate();
  const Icon = card.icon;

  return (
    <button
      onClick={() => navigate(card.to)}
      className="group w-full text-left p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${card.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground mb-1">{card.title}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          {metric != null && (
            <div className="mt-2 text-xs font-semibold text-primary">{metric}</div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

export default function PerformanceHub() {
  const { club } = useClubContext();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['perf-hub-reports', club?.id],
    queryFn: () => base44.entities.Report.filter({ club_id: club.id }, '-created_date', 50),
    enabled: !!club?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: standards = [] } = useQuery({
    queryKey: ['perf-hub-standards', club?.id],
    queryFn: () => base44.entities.TechnicalStandard.filter({ club_id: club.id, is_active: true }),
    enabled: !!club?.id,
    staleTime: 5 * 60 * 1000,
  });

  const finalisedReports = reports.filter(r => r.status === 'published' && !r.is_deleted);
  const hasData = finalisedReports.length > 0;

  // Build metric overlays from live data
  const cardsWithMetrics = HUB_CARDS.map(card => {
    if (card.title === 'Club Progress') {
      return { ...card, metric: finalisedReports.length > 0 ? `${finalisedReports.length} finalised report${finalisedReports.length !== 1 ? 's' : ''}` : null };
    }
    if (card.title === 'Technical Standards') {
      return { ...card, metric: standards.length > 0 ? `${standards.length} club standard${standards.length !== 1 ? 's' : ''}` : null };
    }
    return card;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow="Performance"
        title="Performance Hub"
        subtitle="Trends, leaderboard, technical standards, and drag-risk analysis."
      />

      <div className="mb-5 text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
        All insights use coach-approved, finalised reports only.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      ) : !hasData ? (
        <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground leading-relaxed">
          <Waves className="w-4 h-4 mb-1.5 text-primary" />
          Performance insights appear after coach-approved reports are finalised. Complete your first report to unlock trends and analytics.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cardsWithMetrics.map((card, i) => (
          <HubCard key={`${card.to}-${i}`} card={card} />
        ))}
      </div>

      <FeedbackButton pageRoute="/performance" />
    </div>
  );
}