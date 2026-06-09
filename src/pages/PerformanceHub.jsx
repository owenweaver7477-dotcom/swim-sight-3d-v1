import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { activeCompletedReports, approvedFindings, buildFaultFrequency, reportsBySwimmer, scoreTrendForSwimmer } from '@/components/analytics/analyticsHelpers';
import { Award, BarChart3, BookOpen, ChevronRight, Loader2, Shield, Target, TrendingUp, Trophy, Users, Waves } from 'lucide-react';

const CARDS = [
  {
    to: '/club-progress',
    icon: BarChart3,
    title: 'Club Progress',
    description: 'Finalised report volume, stroke mix, squad activity, approved findings, and recent coach work.',
  },
  {
    to: '/swimmer-trends',
    icon: TrendingUp,
    title: 'Swimmer Trends',
    description: 'Individual progress cards with score trends only when enough finalised reports exist.',
  },
  {
    to: '/club-progress',
    icon: Trophy,
    title: 'Team Leaderboard',
    description: 'Review consistency and improvement using coach-approved data only.',
  },
  {
    to: '/technical-standards',
    icon: Award,
    title: 'Technical Standards',
    description: 'Stroke-phase reference standards that coaches can link to findings and reviews.',
  },
  {
    to: '/reference-library',
    icon: BookOpen,
    title: 'Reference Library',
    description: 'Swimming-only reference profiles and text guidance for coach discussion.',
  },
];

function HubCard({ card, metric }) {
  const navigate = useNavigate();
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={() => navigate(card.to)}
      className="group w-full text-left p-5 rounded-xl bg-white border border-border hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground mb-1">{card.title}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          {metric && <div className="mt-3 text-[10px] font-bold text-primary uppercase tracking-wider">{metric}</div>}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
      </div>
    </button>
  );
}

function MiniMetric({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-border">
      <Icon className="w-4 h-4 text-primary mb-2" />
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-primary mt-1">{sub}</div>}
    </div>
  );
}

export default function PerformanceHub() {
  const { club } = useClubContext();

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['hub-reports', club?.id],
    queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 700),
    enabled: !!club?.id,
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['hub-findings', club?.id],
    queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 1500),
    enabled: !!club?.id,
  });

  const { data: swimmers = [], isLoading: swimmersLoading } = useQuery({
    queryKey: ['hub-swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 400),
    enabled: !!club?.id,
  });

  const isLoading = reportsLoading || findingsLoading || swimmersLoading;

  const summary = useMemo(() => {
    const completed = activeCompletedReports(reports);
    const approved = approvedFindings(findings, completed.map(report => report.id));
    const grouped = reportsBySwimmer(completed);
    const trendReady = Object.values(grouped).filter(swimmerReports => scoreTrendForSwimmer(swimmerReports, 3).hasTrend).length;
    const commonFocus = buildFaultFrequency(approved, 1)[0];
    return {
      completed,
      approved,
      reviewedSwimmers: Object.keys(grouped).length,
      trendReady,
      commonFocus,
    };
  }, [findings, reports]);

  const cards = CARDS.map(card => {
    if (card.title === 'Club Progress') return { ...card, metric: `${summary.completed.length} finalised report${summary.completed.length !== 1 ? 's' : ''}` };
    if (card.title === 'Swimmer Trends') return { ...card, metric: `${summary.trendReady} swimmer trend${summary.trendReady !== 1 ? 's' : ''} ready` };
    if (card.title === 'Team Leaderboard') return { ...card, metric: `${summary.reviewedSwimmers} reviewed swimmer${summary.reviewedSwimmers !== 1 ? 's' : ''}` };
    return card;
  });

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-white border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground">Create or join a club to view progress tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow="Performance"
        title="Performance Hub"
        subtitle="Progress tracking from real finalised reports, approved findings, and coach-reviewed work."
      />

      <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Shield className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Progress views are deliberately conservative. Trends are hidden until enough real report data exists, and nothing here predicts race outcomes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading performance data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MiniMetric icon={BarChart3} label="Finalised reports" value={summary.completed.length} />
            <MiniMetric icon={Users} label="Reviewed swimmers" value={summary.reviewedSwimmers} sub={`of ${swimmers.length}`} />
            <MiniMetric icon={Target} label="Approved findings" value={summary.approved.length} />
            <MiniMetric icon={TrendingUp} label="Trends ready" value={summary.trendReady} />
          </div>

          {summary.completed.length === 0 && (
            <div className="mb-6 p-5 rounded-xl bg-white border border-border text-center">
              <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <div className="text-sm font-semibold text-foreground">Progress unlocks after finalised reports</div>
              <p className="text-xs text-muted-foreground mt-1">Run a review, approve findings, and finalise the report to start building honest trend data.</p>
            </div>
          )}

          {summary.commonFocus && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Current common focus</div>
              <div className="text-sm font-semibold text-amber-950">{summary.commonFocus.name}</div>
              <div className="text-xs text-amber-700 mt-1">{summary.commonFocus.count} approved finding{summary.commonFocus.count !== 1 ? 's' : ''}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map(card => <HubCard key={card.title} card={card} metric={card.metric} />)}
          </div>
        </>
      )}
    </div>
  );
}
