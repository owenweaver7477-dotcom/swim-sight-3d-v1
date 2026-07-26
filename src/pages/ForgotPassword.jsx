import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";

export default function ForgotPassword() {
  const { resetPasswordRequest, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const visibleError = error || (authError?.type === 'config_error' ? authError.message : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPasswordRequest(email);
      // Only on a genuine success. This stays enumeration-safe without hiding failures:
      // resetPasswordForEmail resolves for unknown emails too, so getting here says
      // nothing about whether the account exists — which is exactly why the confirmation
      // wording below can stay vague while still being true.
      setSent(true);
    } catch (err) {
      // A real send failure: mailer rate limit, SMTP outage, network. This used to be
      // swallowed and the success screen shown anyway, so a locked-out coach would wait
      // for a link that was never sent. Show it, and log it so the failure is visible to
      // us and not only to them.
      console.error('Password reset request failed:', err);
      setError(err.message || 'We could not send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {visibleError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {visibleError}
        </div>
      )}
      {sent ? (
        <p className="text-sm text-foreground text-center">
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
