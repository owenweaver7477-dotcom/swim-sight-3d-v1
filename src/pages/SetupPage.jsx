import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewSession, setReviewSession } from '@/lib/swimState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import { SWIM_STROKES, DRYLAND_MOVEMENTS, CAMERA_ANGLES, REVIEW_TYPES } from '@/lib/swimState';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function SetupPage() {
  const session = getReviewSession();
  const [environment, setEnvironment] = useState('swim');
  const [stroke, setStroke] = useState('');
  const [angle, setAngle] = useState('');
  const [reviewType, setReviewType] = useState('full_review');
  const navigate = useNavigate();

  const createReview = useMutation({
    mutationFn: async (data) => {
      let videoUploadId = null;
      if (session?.file_name) {
        const upload = await base44.entities.VideoUpload.create({
          club_id: session.club_id || undefined,
          swimmer_id: session.swimmer_id || undefined,
          file_name: session.file_name,
          file_size: session.file_size || 0,
          file_url: session.file_url || undefined,
          environment: data.environment,
          stroke_or_movement: data.stroke,
          camera_angle: data.angle,
          status: session.file_url ? 'ready' : 'uploaded',
        });
        videoUploadId = upload.id;
      }
      const review = await base44.entities.Review.create({
        club_id: session?.club_id || undefined,
        swimmer_id: session?.swimmer_id || undefined,
        video_upload_id: videoUploadId || undefined,
        review_type: data.reviewType,
        stroke_or_movement: data.stroke,
        camera_angle: data.angle,
        environment: data.environment,
        status: 'in_progress',
      });
      return review;
    },
    onSuccess: (review) => {
      const updated = { ...session, review_id: review.id, environment, stroke_or_movement: stroke, camera_angle: angle, review_type: reviewType };
      setReviewSession(updated);
      navigate('/analyse');
    },
  });

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">No upload session found. Start by uploading a clip.</p>
        <Button onClick={() => navigate('/upload')}>Upload Footage</Button>
      </div>
    );
  }

  const movements = environment === 'swim' ? SWIM_STROKES : DRYLAND_MOVEMENTS;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Review Setup"
        title="Configure Review"
        subtitle={`Clip: ${session.file_name}`}
      />

      <div className="space-y-5">
        <div>
          <Label className="text-xs text-muted-foreground">Environment</Label>
          <div className="flex gap-2 mt-1">
            {['swim', 'dryland'].map(env => (
              <button
                key={env}
                onClick={() => { setEnvironment(env); setStroke(''); }}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                  environment === env ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Stroke / Movement</Label>
          <Select value={stroke} onValueChange={setStroke}>
            <SelectTrigger className="bg-card border-border mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {movements.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Camera Angle</Label>
          <Select value={angle} onValueChange={setAngle}>
            <SelectTrigger className="bg-card border-border mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {CAMERA_ANGLES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Review Type</Label>
          <Select value={reviewType} onValueChange={setReviewType}>
            <SelectTrigger className="bg-card border-border mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REVIEW_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate('/upload')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground"
            disabled={!stroke || !angle || createReview.isPending}
            onClick={() => createReview.mutate({ environment, stroke, angle, reviewType })}
          >
            {createReview.isPending ? 'Creating...' : 'Start Analysis'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}