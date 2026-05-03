import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AuthCardTopHome } from '@/components/auth/AuthCardTopHome';
import { Button } from '@/components/ui/button';
import { VERIFY_EMAIL } from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';

type VerifyState = 'idle' | 'loading' | 'success' | 'error' | 'invalid';

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-muted/35 relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b via-background to-background px-3 py-8 sm:px-4 sm:py-12">
      <div
        aria-hidden
        className="bg-primary/10 absolute -right-16 top-14 h-44 w-44 rounded-full blur-3xl"
      />
      <div className="border-primary/20 relative w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-lg shadow-black/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.1] via-primary/[0.02] to-transparent"
        />
        <AuthCardTopHome />
        {children}
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const emailRaw = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';
  const email = emailRaw.trim().toLowerCase();

  const [state, setState] = useState<VerifyState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const requestStarted = useRef(false);

  useEffect(() => {
    if (requestStarted.current) {
      return;
    }
    if (!email || !token || token.length < 64) {
      setState('invalid');
      return;
    }
    requestStarted.current = true;
    setState('loading');
    void VERIFY_EMAIL({ email, token })
      .then(() => {
        setState('success');
      })
      .catch((err: unknown) => {
        setErrorMessage(getApiErrorMessage(err, 'Verification failed.'));
        setState('error');
      });
  }, [email, token]);

  if (state === 'invalid') {
    return (
      <CardShell>
        <div className="relative z-10 px-4 py-10 text-center sm:px-8 sm:py-12">
          <div className="bg-destructive/10 text-destructive mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
            <AlertCircle size={26} strokeWidth={1.5} />
          </div>
          <h1 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
            Invalid verification link
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            This link is missing a valid email or token. Open the link from your
            registration email, or register again.
          </p>
          <Link
            className="text-primary mt-6 inline-block text-sm font-medium hover:underline hover:underline-offset-4"
            to="/tenant/register"
          >
            Create a workspace →
          </Link>
        </div>
      </CardShell>
    );
  }

  if (state === 'loading') {
    return (
      <CardShell>
        <div className="relative z-10 flex flex-col items-center px-4 py-12 sm:px-8 sm:py-16">
          <Loader2
            aria-hidden
            className="text-primary mb-4 h-10 w-10 animate-spin"
            strokeWidth={1.5}
          />
          <p className="text-muted-foreground text-sm">Verifying your email…</p>
        </div>
      </CardShell>
    );
  }

  if (state === 'error') {
    return (
      <CardShell>
        <div className="relative z-10 px-4 py-10 text-center sm:px-8 sm:py-12">
          <div className="bg-destructive/10 text-destructive mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
            <AlertCircle size={26} strokeWidth={1.5} />
          </div>
          <h1 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
            Could not verify email
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {errorMessage}
          </p>
          <Link className="mt-6 block" state={{ registeredEmail: email }} to="/tenant/login">
            <Button className="w-full" size="lg" variant="secondary" type="button">
              Back to sign in
            </Button>
          </Link>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <div className="relative z-10 px-4 py-10 text-center sm:px-8 sm:py-12">
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          <CheckCircle2 size={26} strokeWidth={1.5} />
        </div>
        <h1 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
          Email verified
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          You can now sign in with{' '}
          <span className="text-foreground font-medium">{email}</span> and your password.
        </p>
        <Link className="mt-6 block" state={{ registeredEmail: email }} to="/tenant/login">
          <Button className="w-full" size="lg" type="button">
            Continue to sign in
          </Button>
        </Link>
      </div>
    </CardShell>
  );
}
