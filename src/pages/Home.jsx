import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Waves, Video, Brain, Camera, Pencil, BookOpen, BarChart3,
  FileText, ArrowRight, CheckCircle2, AlertTriangle, Lock, Shield, EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const FEATURES = [
  { icon: Video,     title: 'Video Review Workspace',            desc: 'Upload swim footage, step frame by frame, tag stroke phases, and build coach findings from any angle.' },
  { icon: Brain,     title: 'AI-Assisted Pose Analysis',         desc: 'AI identifies technical faults and suggests corrections. Every finding requires coach approval before it reaches a swimmer.' },
  { icon: Camera,    title: 'Multi-Angle Upload Workflow',        desc: 'Organise underwater side, above-water, front, rear, and deck angles per analysis session. Primary angle drives AI processing.' },
  { icon: Pencil,    title: 'Coach Annotation & Drag-Risk Tools', desc: 'Draw body lines, angle markers, and flow overlays directly on video. Estimate hydrodynamic resistance areas with drag-risk visualisation.' },
  { icon: BookOpen,  title: 'Drill Library & Technical Focus',    desc: 'Match findings to targeted drills by stroke, phase, and fault tag. Assign next-focus areas with every report.' },
  { icon: BarChart3, title: 'Swimmer Progress Analytics',         desc: 'Track technique scores, fault frequency trends, and phase-by-phase improvement over time across your squad.' },
  { icon: FileText,  title: 'Professional PDF & Shared Reports',  desc: 'Generate coach-approved reports with findings, cues, drills, and annotations. Download as PDF or send a private share link.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Waves className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground">Swim Sight 3D</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs bg-primary text-primary-foreground">Create Account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Waves className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Swim Sight 3D</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight tracking-tight mb-5 max-w-3xl">
            Coach-led video analysis, technical reporting, and swim performance tracking for modern clubs.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Upload footage, run AI pose analysis, review findings as the coach, and deliver professional reports to swimmers and parents — all inside a private club workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Log In <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="font-semibold">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">Platform Features</div>
          <h2 className="text-xl font-bold text-foreground mb-10">Everything a coaching team needs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Honesty ── */}
      <section className="py-20 px-4 bg-card/40 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200 max-w-2xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-900 mb-1.5">AI supports the coach — it does not replace the coach.</div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Pose-assisted findings, drag-risk overlays, scores, and report content require coach review before being shared. No AI output is shown to a swimmer or parent without explicit coach approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="py-20 px-4 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">Privacy First</div>
          <h2 className="text-xl font-bold text-foreground mb-8">Your coaching data stays private</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Lock,         text: 'Uploaded videos are private by default' },
              { icon: EyeOff,       text: 'Reports are private unless you create a share link' },
              { icon: Shield,       text: 'Club data is never visible to other clubs' },
              { icon: CheckCircle2, text: 'Swimmer profiles visible only to authorised users' },
              { icon: Lock,         text: 'Public share links are optional and revocable' },
              { icon: Shield,       text: 'AI findings require coach sign-off before sharing' },
            ].map(p => (
              <div key={p.text} className="flex items-center gap-3 p-3.5 rounded-lg bg-card border border-border">
                <p.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Waves className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Swim Sight 3D</span>
            </div>
            <div className="text-xs text-muted-foreground">Coach-led analysis platform</div>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs bg-primary text-primary-foreground">Register</Button>
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
