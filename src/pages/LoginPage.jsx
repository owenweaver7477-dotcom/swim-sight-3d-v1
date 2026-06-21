import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { setActiveClub, setActiveRole } from '@/lib/swimState';
import PageHeader from '@/components/shared/PageHeader';
import { Users, Shield, Eye, User } from 'lucide-react';

const roles = [
  { value: 'Club Admin', icon: Shield, desc: 'Manage club settings, squads and members' },
  { value: 'Coach', icon: Eye, desc: 'Review footage, build reports, manage swimmers' },
  { value: 'Swimmer', icon: Users, desc: 'Submit footage and view reports' },
  { value: 'Personal Review', icon: User, desc: 'Review your own footage without a club' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedClubId, setSelectedClubId] = useState('');
  const navigate = useNavigate();

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => base44.entities.Club.list('-created_date', 50),
  });

  const needsClub = selectedRole && selectedRole !== 'Personal Review';

  const handleContinue = () => {
    if (!selectedRole) return;
    setActiveRole(selectedRole);

    if (selectedRole === 'Personal Review') {
      setActiveClub(null);
      window.dispatchEvent(new Event('swimStateChanged'));
      navigate('/upload');
      return;
    }

    const club = clubs.find(c => c.id === selectedClubId);
    if (club) {
      setActiveClub(club);
      window.dispatchEvent(new Event('swimStateChanged'));
      if (selectedRole === 'Club Admin') navigate('/club-settings');
      else if (selectedRole === 'Coach') navigate('/team-dashboard');
      else navigate('/upload');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Sign In"
        title="Select Your Role"
        subtitle="Choose how you'll use Swim Sight 3D. Club roles require selecting an active club workspace."
      />

      <div className="space-y-3 mb-6">
        {roles.map(r => (
          <button
            key={r.value}
            onClick={() => { setSelectedRole(r.value); setSelectedClubId(''); }}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selectedRole === r.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                selectedRole === r.value ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                <r.icon className={`w-4 h-4 ${selectedRole === r.value ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{r.value}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {needsClub && (
        <div className="mb-6 space-y-3">
          <Label className="text-sm text-muted-foreground">Select Club Workspace</Label>
          {clubs.length > 0 ? (
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Choose a club..." />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 rounded-lg bg-secondary text-sm text-muted-foreground">
              No clubs found. <a href="/club-onboarding" className="text-primary underline">Create a club</a> first.
            </div>
          )}
        </div>
      )}

      <Button
        className="w-full bg-primary text-primary-foreground"
        disabled={!selectedRole || (needsClub && !selectedClubId)}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}