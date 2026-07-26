import React from "react";
import { SIGN_IN_HELP_MAILTO, SUPPORT_EMAIL } from "@/lib/supportConfig";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
        {/* A route to a human, on every auth screen. Someone who cannot sign in cannot
            reach any in-app help — without this they are locked out with nowhere to go.
            Uses the single SUPPORT_EMAIL constant so it can never point at a dead inbox. */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Trouble signing in?{" "}
          <a href={SIGN_IN_HELP_MAILTO} className="font-medium text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
