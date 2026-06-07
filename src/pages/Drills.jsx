import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Dumbbell, ChevronRight, X, Target, Tag, Waves, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const drillPacks = [
  {
    stroke: 'Breaststroke',
    name: 'Breaststroke Kick Mechanics',
    fixes: 'Knees too wide, early foot turn, circular kick, hips dropping',
    tags: ['Pool', 'Kick'],
    keyFault: 'Knees Too Wide / Early Foot Turn',
    drills: [
      { name: 'Narrow Knee Wall Kick', fault: 'Knees too wide', cue: 'Keep knees inside hip line — heels rise first', equipment: 'Pool wall', desc: 'Face the pool wall, hands on edge. Kick breaststroke and visually check your knee width. Knees should stay hip-width or narrower throughout the heel recovery.' },
      { name: 'Late Turn Kick Drill', fault: 'Early foot turn', cue: 'Heels first — delay the foot turn until heels are at bum level', equipment: 'Pool', desc: 'Focus on lifting heels straight up before turning the feet out. The turn should be the last action, not the first. Count "up-up-turn-snap" mentally.' },
      { name: 'Back Kick Breaststroke', fault: 'Bad foot path', cue: 'Feel the water with your foot soles — drive straight back', equipment: 'Pool, pull buoy', desc: 'Swim on your back using breaststroke kick. This forces correct foot engagement and helps swimmers feel the backward drive without hip compensation.' },
      { name: 'Pull Buoy Between Knees', fault: 'Wide knees', cue: 'Squeeze lightly — kick from hips and feet, not just knees', equipment: 'Pull buoy', desc: 'Place a pull buoy between your knees. Complete breaststroke kick while maintaining gentle contact with the buoy. Builds narrow knee muscle memory.' },
      { name: 'Piston Snap Drill', fault: 'Circular kick', cue: 'Drive water straight back like pistons — no circular path', equipment: 'Pool', desc: 'Kick from a vertical position in deep water. Focus on the foot snapping straight backward and together at the finish. No outward circular motion.' },
    ]
  },
  {
    stroke: 'Freestyle',
    name: 'Freestyle Catch & Pull',
    fixes: 'Dropped elbow, slipping catch, short finish, poor forearm engagement',
    tags: ['Pool'],
    keyFault: 'Dropped Elbow / Weak Catch',
    drills: [
      { name: 'Fingertip Drag', fault: 'Dropped elbow', cue: 'Elbow leads — fingertips drag along the surface', equipment: 'Pool', desc: 'During the recovery phase, drag your fingertips along the water surface. This forces a high elbow position and teaches proper catch setup.' },
      { name: 'Catch-Up Drill', fault: 'Early pull', cue: 'Wait — full extension before the next stroke begins', equipment: 'Pool', desc: 'Touch the extended hand before starting the next stroke. Develops patience in the catch and builds full extension before pulling.' },
      { name: 'Fist Drill', fault: 'Poor forearm use', cue: 'Feel the water with your forearm, not just your hand', equipment: 'Pool', desc: 'Close your fists and swim freestyle. Forces the swimmer to use the forearm as the primary catch surface. Open hands feel powerful afterward.' },
      { name: 'Side Kick Rotation', fault: 'Flat body', cue: 'Hip drives the shoulder — rotate fully each stroke', equipment: 'Pool', desc: 'Kick on your side with one arm extended. Focus on hip-to-shoulder rotation. Switch sides with three strokes in between.' },
    ]
  },
  {
    stroke: 'Freestyle',
    name: 'Freestyle Body Position',
    fixes: 'Sinking hips, excessive drag, head too high, poor body line',
    tags: ['Pool', 'Body Position'],
    keyFault: 'Sinking Hips / High Head',
    drills: [
      { name: 'Torpedo Kick', fault: 'Sinking hips', cue: 'Straight line head to heel — press chest slightly down', equipment: 'Pool', desc: 'Arms tight in streamline overhead, kick in a straight horizontal position. Builds core awareness and a flat body line.' },
      { name: '6-3-6 Drill', fault: 'Poor rotation', cue: 'Drive rotation from the hip — shoulder follows', equipment: 'Pool', desc: 'Six kicks on one side, three full strokes, six kicks on the other side. Builds rotation awareness and balance.' },
      { name: 'Low Breath Drill', fault: 'Head too high', cue: 'One goggle in, one goggle out — chin near surface', equipment: 'Pool', desc: 'Practice turning to breathe with only half the face clearing the water. Prevents the "lifting" head that drops hips.' },
    ]
  },
  {
    stroke: 'Butterfly',
    name: 'Butterfly Timing & Undulation',
    fixes: 'Mistimed kick, breathing disrupts rhythm, poor undulation, hips dropping',
    tags: ['Pool'],
    keyFault: 'Kick Timing / Hips Dropping',
    drills: [
      { name: 'Single Arm Butterfly', fault: 'Timing off', cue: 'Entry kick, exit kick — feel both kicks per stroke', equipment: 'Pool', desc: 'One arm strokes, the other stays at the side. Focus on executing two kicks per arm cycle and driving the body wave from the chest.' },
      { name: 'Body Dolphin Drill', fault: 'Poor undulation', cue: 'Wave from chest to toes — not just the hips', equipment: 'Pool', desc: 'Arms at sides, dolphin kick with full body undulation. The wave should travel from the chest downward, not initiate from the hips.' },
      { name: '3-3-3 Breathing Pattern', fault: 'Breathing too often', cue: 'Breathe less — maintain the wave rhythm', equipment: 'Pool', desc: 'Alternate three strokes with breath, three without. Builds breath control and rhythm without allowing head position to disrupt the stroke.' },
    ]
  },
  {
    stroke: 'Backstroke',
    name: 'Backstroke Rotation & Entry',
    fixes: 'Flat body, shoulder impingement, poor catch depth, crossover entry',
    tags: ['Pool'],
    keyFault: 'Flat Body / Poor Entry Angle',
    drills: [
      { name: 'Cup Drill', fault: 'Head lifting', cue: 'Still head — eyes on one point on the ceiling', equipment: 'Cup, pool', desc: 'Place a small cup on your forehead. Swim backstroke without spilling. Forces head stability and teaches separation of shoulder from head rotation.' },
      { name: 'Single Arm Backstroke', fault: 'Flat body', cue: 'Shoulder drives through — rotate to load the catch', equipment: 'Pool', desc: 'One arm strokes at a time while the other stays at the side. Focus on shoulder rotation and pinky-first hand entry.' },
      { name: 'Spin Drill', fault: 'Poor rotation timing', cue: 'Exaggerate each side — pause at the peak of rotation', equipment: 'Pool', desc: 'Six strokes right arm only, six strokes left arm only. Exaggerate the rotation each time you switch. Builds rotation awareness and coordination.' },
    ]
  },
  {
    stroke: 'Starts & Turns',
    name: 'Underwater Breakout',
    fixes: 'Shallow entry, poor streamline, early breakout, weak dolphins',
    tags: ['Pool'],
    keyFault: 'Early Breakout / Weak Dolphins',
    drills: [
      { name: 'Streamline Push-Off', fault: 'Poor streamline', cue: 'Lock arms over ears — hands flat, body long', equipment: 'Pool wall', desc: 'Push off the wall in a tight streamline. Hold the position and count dolphin kicks before surfacing. Focus on maintaining a tight body line throughout.' },
      { name: 'Underwater Dolphin Count', fault: 'Early breakout', cue: 'One more kick than feels comfortable', equipment: 'Pool', desc: 'Set a target number of dolphin kicks off each wall — 5 to 7 is typical for senior swimmers. Count aloud mentally and build consistency.' },
      { name: 'Track Start Hold', fault: 'Slow reaction', cue: 'Weight forward, grip tight, hips above shoulders', equipment: 'Blocks', desc: 'Practice the track start position on blocks. Hold the set position for 3 seconds before diving. Builds start position muscle memory.' },
    ]
  },
  {
    stroke: 'Dryland',
    name: 'Hip & Knee Stability',
    fixes: 'Knee valgus, hip drop, poor single-leg stability, breaststroke knee pain risk',
    tags: ['Dryland', 'Gym'],
    keyFault: 'Knee Valgus / Hip Drop',
    drills: [
      { name: 'Single-Leg Squat to Box', fault: 'Knee valgus', cue: 'Knee tracks over toes — no caving inward', equipment: 'Box', desc: 'Lower onto a box on one leg. Watch that the knee does not collapse inward. Directly targets breaststroke knee stability.' },
      { name: 'Lateral Band Walk', fault: 'Hip drop', cue: 'Drive out against the band — hips stay level', equipment: 'Resistance band', desc: 'Band above knees, walk sideways in an athletic stance. Activates the gluteus medius — critical for breaststroke kick control and hip stability.' },
      { name: 'Glute Bridge Hold', fault: 'Weak hip extension', cue: 'Drive hips up, squeeze glutes — keep hips level', equipment: 'Mat', desc: 'Lie on back with knees bent. Drive hips to ceiling and hold for 30 seconds. Targets glute activation used in kick finish and body position.' },
    ]
  },
  {
    stroke: 'Dryland',
    name: 'Streamline Mobility',
    fixes: 'Tight shoulders, poor overhead reach, broken streamline position',
    tags: ['Dryland', 'Mobility'],
    keyFault: 'Poor Overhead Reach',
    drills: [
      { name: 'Wall Streamline Test', fault: 'Broken streamline', cue: 'Zero gap between hands and wall — full overhead reach', equipment: 'Wall', desc: 'Stand with back flat against a wall, arms overhead in streamline. Check the gap between your hands and the wall. Target: no gap.' },
      { name: 'Shoulder Pass-Throughs', fault: 'Tight shoulders', cue: 'Slow and controlled — feel the stretch behind the shoulder', equipment: 'Band or stick', desc: 'Hold a band or stick with a wide grip. Slowly pass it over the head and behind the back. Increases shoulder range for streamline and catch.' },
      { name: 'Thoracic Extension on Roller', fault: 'Poor upper back mobility', cue: 'Let gravity do the work — breathe out as you extend', equipment: 'Foam roller', desc: 'Foam roller under the upper back. Arms overhead. Allow the thoracic spine to extend. Frees up the overhead position needed for a full streamline.' },
    ]
  },
];

const STROKE_COLORS = {
  Breaststroke: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/30',
  Freestyle: 'bg-blue-900/40 text-blue-400 border-blue-700/30',
  Butterfly: 'bg-purple-900/40 text-purple-400 border-purple-700/30',
  Backstroke: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/30',
  'Starts & Turns': 'bg-yellow-900/40 text-yellow-400 border-yellow-700/30',
  Dryland: 'bg-orange-900/40 text-orange-400 border-orange-700/30',
};

export default function Drills() {
  const [selectedPack, setSelectedPack] = useState(null);
  const [filterStroke, setFilterStroke] = useState('All');
  const strokes = ['All', 'Breaststroke', 'Freestyle', 'Butterfly', 'Backstroke', 'Starts & Turns', 'Dryland'];

  const filtered = filterStroke === 'All' ? drillPacks : drillPacks.filter(p => p.stroke === filterStroke);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Drill Library"
        title="Corrective Drill Packs"
        subtitle="Stroke-specific drills linked to common technical faults. Each drill targets a specific error with coaching cues."
      />

      {!selectedPack ? (
        <>
          {/* Stroke filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            {strokes.map(s => (
              <button
                key={s}
                onClick={() => setFilterStroke(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStroke === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(pack => (
              <button
                key={pack.name}
                onClick={() => setSelectedPack(pack)}
                className="text-left p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${STROKE_COLORS[pack.stroke] || 'bg-secondary text-muted-foreground border-border'}`}>
                    {pack.stroke}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{pack.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <Tag className="w-3 h-3 text-destructive/70" />
                  <span className="text-[10px] text-muted-foreground">{pack.keyFault}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {pack.tags.map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px]">{pack.drills.length} drills</Badge>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedPack(null)}>
            <X className="w-3.5 h-3.5 mr-1" /> Back to Drill Packs
          </Button>

          <div className="p-5 rounded-xl bg-card border border-border mb-4">
            <div className="flex items-start justify-between mb-2">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${STROKE_COLORS[selectedPack.stroke] || 'bg-secondary text-muted-foreground border-border'}`}>
                {selectedPack.stroke}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{selectedPack.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3.5 h-3.5 text-destructive/70" />
              Fixes: {selectedPack.fixes}
            </div>
          </div>

          <div className="space-y-3">
            {selectedPack.drills.map((drill, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground">{i + 1}. {drill.name}</h4>
                  <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{drill.equipment}</Badge>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Tag className="w-3 h-3 text-destructive/70" />
                  <span className="text-[10px] text-muted-foreground">Fixes: <span className="text-destructive/80">{drill.fault}</span></span>
                </div>
                {drill.cue && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 mb-3">
                    <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Cue: </span>
                    <span className="text-xs text-foreground font-medium">{drill.cue}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">{drill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}