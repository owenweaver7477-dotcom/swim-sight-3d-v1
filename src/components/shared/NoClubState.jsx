import React from 'react';
import EmptyState from './EmptyState';
import { Users } from 'lucide-react';

export default function NoClubState({ message }) {
  return (
    <EmptyState
      icon={Users}
      title="No Club Selected"
      description={message || "Join an existing club or create your own workspace to continue."}
      actions={[
        { label: 'Join or Create Club', to: '/club-onboarding' },
      ]}
    />
  );
}