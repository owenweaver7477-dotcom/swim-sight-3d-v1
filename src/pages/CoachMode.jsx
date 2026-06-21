import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getCoachModeFinding } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Eye, Zap, Target, Dumbbell, User, Search, Waves, Plus } from 'lucide-react';

const QUICK_TAGS = [
  'Hips Low', 'Late Breath', 'Wide Knees', 'Weak Catch',
  'Poor Breakout', 'Slow Turn', 'Timing Off', 'Head Too High',
  'Early Foot Turn', 'Shallow Entry', 'Short Finish', 'Poor Rotation',
];

const QUICK_DRILLS = {
  'Wide Knees': 'Narrow Knee Wall Kick',
  'Early Foot Turn': 'Late Turn Kick Drill',
  'Hips Low': 'Torpedo Kick Drill',
  'Weak Catch': 'Fingertip Drag',
  'Head Too High': 'Low Breath Drill',
  'Timing Off': 'Single Arm Drill',
  'Poor Rotation': '6-3-6 Rotation Drill',
  'Slow Turn': 'Touch-Turn-Push Drill',
};

export default function CoachMode() {
  const finding = getCoachModeFinding();
  const [mode, setMode] = useState(finding ? 'detail' : 'pool-deck');
  const [selectedTag, setSelectedTag] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [selectedSwimmer, setSelectedSwimmer] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { club, loading } = useClubContext();

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers-coach', club?.id],
    queryFn: () => base44.entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
  });

  const filteredSwimmers = swimmers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // No club state
  if (!club) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-card border border-border text-center">
          <Waves className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace</div>
          <p className="text-xs text-muted-foreground mb-4">Create a club workspace before using Coach Mode.</p>
          <Button size="sm" onClick={() => navigate('/club-onboarding')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Club
          </Button>
        </div>
      </div>
    );
  }

  // Detail mode — showing a specific finding
  if (mode === 'detail') {
    if (!finding) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="p-10 rounded-xl bg-card border border-border text-center">
            <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-medium text-foreground mb-1">No Finding Selected</div>
            <p className="text-xs text-muted-foreground mb-4">Send a finding from the analysis workspace, or use Pool Deck mode for quick coaching.</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => setMode('pool-deck')}>Pool Deck Mode</Button>
              <Button size="sm" onClick={() => navigate('/analyse')}>Go to Analysis</Button>
            </div>
          </div>
        </div>
      );
    }

    const severityColors = {
      low: 'text-green-400 bg-green-900/30',
      medium: 'text-yellow-400 bg-yellow-900/30',
      high: 'text-orange-400 bg-orange-900/30',
      critical: 'text-red-400 bg-red-900/30',
    };

    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">Coach Mode</div>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setMode('pool-deck')}>
                ← Pool Deck
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/analyse')}>
              Back to Analysis
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">{finding.finding_name}</h2>
                  {finding.severity && (
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${severityColors[finding.severity] || 'text-muted-foreground'}`}>
                      {finding.severity}
                    </span>
                  )}
                </div>
                {finding.phase && (
                  <div className="inline-block px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                    Phase: {finding.phase}
                  </div>
                )}
                {finding.coach_sees && (
                  <div className="mb-5">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Coach Sees</div>
                    <p className="text-base text-foreground leading-relaxed">{finding.coach_sees}</p>
                  </div>
                )}
                {finding.why_it_matters && (
                  <div className="mb-5 p-4 rounded-lg bg-secondary border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Why It Matters</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{finding.why_it_matters}</p>
                  </div>
                )}
              </div>
              {finding.cue && (
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/30">
                  <div className="text-[10px] text-primary uppercase tracking-wider mb-2">Coaching Cue</div>
                  <p className="text-xl font-bold text-foreground leading-tight">"{finding.cue}"</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {finding.drill && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" /> Assigned Drill
                  </div>
                  <div className="text-sm font-semibold text-foreground">{finding.drill}</div>
                </div>
              )}
              {finding.next_focus && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Next Focus
                  </div>
                  <div className="text-sm font-semibold text-foreground">{finding.next_focus}</div>
                </div>
              )}
              <Button className="w-full bg-primary text-primary-foreground text-sm" onClick={() => navigate('/drills')}>
                <Dumbbell className="w-4 h-4 mr-2" /> View Drill Library
              </Button>
              <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/report')}>
                <Target className="w-4 h-4 mr-2" /> Build Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pool deck mode
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">Pool Deck Mode</div>
            <h1 className="text-xl font-bold text-foreground">Quick Analysis</h1>
            <div className="text-xs text-muted-foreground">{club.name}</div>
          </div>
          {finding && (
            <Button size="sm" variant="outline" onClick={() => setMode('detail')}>
              <Eye className="w-3.5 h-3.5 mr-1" /> View Finding
            </Button>
          )}
        </div>

        {/* Swimmer selector */}
        <div className="p-4 rounded-xl bg-card border border-border mb-4">
          <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" /> Select Swimmer
          </div>
          {swimmers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-3">No swimmers in this club yet.</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/swimmers')}>
                <Plus className="w-3 h-3 mr-1" /> Add Swimmer
              </Button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search swimmer..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSwimmers.slice(0, 8).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSwimmer(selectedSwimmer?.id === s.id ? null : s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedSwimmer?.id === s.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
                {filteredSwimmers.length === 0 && (
                  <span className="text-xs text-muted-foreground">No swimmers match your search.</span>
                )}
              </div>
              {selectedSwimmer && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Selected: <span className="text-primary font-semibold">{selectedSwimmer.name}</span>
                  {selectedSwimmer.main_strokes && ` · ${selectedSwimmer.main_strokes}`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Fault Tags — only show when swimmer selected */}
        {selectedSwimmer && (
          <div className="p-4 rounded-xl bg-card border border-border mb-4">
            <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> Quick Fault Tags
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`py-3 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                    selectedTag === tag
                      ? 'bg-destructive/15 border-destructive/50 text-destructive'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drill suggestion */}
        {selectedTag && selectedSwimmer && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" /> Suggested Drill
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">
              {QUICK_DRILLS[selectedTag] || 'See Drills Library →'}
            </div>
            <div className="text-xs text-muted-foreground">
              Tagged fault: <span className="text-destructive font-medium">{selectedTag}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/drills')}>
                <Dumbbell className="w-3 h-3 mr-1" /> Full Drill Library
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/analyse')}>
                Start Full Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Quick Note */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="text-xs font-semibold text-foreground mb-2">Quick Note</div>
          <textarea
            value={quickNote}
            onChange={e => setQuickNote(e.target.value)}
            placeholder={`${selectedSwimmer ? selectedSwimmer.name + ' — ' : ''}Poolside observation...`}
            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={4}
          />
          <Button
            size="sm"
            className="mt-2 w-full bg-primary text-primary-foreground text-xs"
            onClick={() => navigate('/analyse')}
          >
            → Start Full Analysis Session
          </Button>
        </div>
      </div>
    </div>
  );
}