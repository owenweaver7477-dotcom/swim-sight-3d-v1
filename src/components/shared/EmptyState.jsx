import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, actions }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {actions && (
        <div className="flex flex-wrap gap-2 justify-center">
          {actions.map((action, i) => (
            action.to ? (
              <Link key={i} to={action.to}>
                <Button variant={action.variant || 'default'} size="sm">{action.label}</Button>
              </Link>
            ) : (
              <Button key={i} variant={action.variant || 'default'} size="sm" onClick={action.onClick} disabled={action.disabled}>
                {action.label}
              </Button>
            )
          ))}
        </div>
      )}
    </div>
  );
}