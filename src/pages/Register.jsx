import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import {
  appendInviteParam,
  getInviteJoinPath,
  peekPendingInviteCode,
  rememberInviteCodeFromSearch,
} from "@/lib/inviteRedirect";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle, isGoogleAuthEnabled, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const visibleError = error || authError?.message || '';
  const pendingInviteCode = useMemo(
    () => rememberInviteCodeFromSearch(location.search) || peekPendingInviteCode(),
    [location.search]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const inviteCode = peekPendingInviteCode();
      const postRegisterPath = inviteCode ? getInviteJoinPath(inviteCode) : "/club-onboarding";
      const result = await register({ email, password, redirectTo: postRegisterPath });
      if (result?.session) {
        navigate(postRegisterPath, { replace: true });
      } else {
        setCheckEmail(true);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle(pendingInviteCode ? getInviteJoinPath(pendingInviteCode) : "/club-onboarding");
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    }
  };

  if (checkEmail) {
    return (
      <AuthLayout
        icon={Mail}
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}`}
      >
        {visibleError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {visibleError}
          </div>
        )}
        <p className="text-sm text-foreground text-center">
          Open the link in that email to finish creating your account. Once confirmed,
          you can log in and continue {pendingInviteCode ? 'joining your club.' : 'to club setup.'}
        </p>
        <Button className="w-full h-12 font-medium mt-6" asChild>
          <Link to={appendInviteParam('/login', pendingInviteCode)}>Back to log in</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to={appendInviteParam('/login', pendingInviteCode)} className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {isGoogleAuthEnabled && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-sm font-medium mb-6"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

      {visibleError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {visibleError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
