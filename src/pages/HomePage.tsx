import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Building2, CreditCard, Layers, Library, ListTodo, Sparkles, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { tenantAuthenticatedHomePath } from '@/lib/tenant/tenantHomePath';
import { cn } from '@/lib/utils';
import { SandboxCreditCardCorner } from '@/pages/home/SandboxCreditCardCorner';
import { useAppSelector } from '@/store/hooks';

const cardInner =
  'bg-card hover:border-primary/40 group flex flex-col rounded-2xl border border-border p-3 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-4';

const MANUAL_TOC = [
  { href: '#manual-sign-in', label: 'Sign-in entry points' },
  { href: '#manual-org-admin', label: 'Organization administrator' },
  { href: '#manual-member', label: 'Invited member' },
  { href: '#manual-billing', label: 'Billing & checkout' },
  { href: '#manual-workspaces', label: 'Workspaces & tasks' },
  { href: '#manual-conventions', label: 'Conventions' },
] as const;

type ProcedureStep = { title: string; detail: string };

function ProcedureBlock({ heading, steps }: { heading: string; steps: readonly ProcedureStep[] }) {
  return (
    <div className="border-border/70 bg-muted/25 rounded-lg border p-3 sm:p-4">
      <p className="text-foreground mb-2 font-mono text-[0.65rem] font-semibold uppercase tracking-wider">
        Procedure — {heading}
      </p>
      <ol className="text-muted-foreground list-decimal space-y-2 pl-4 text-xs leading-relaxed sm:text-sm">
        {steps.map((step) => (
          <li key={step.title}>
            <span className="text-foreground font-medium">{step.title}</span>
            {' — '}
            {step.detail}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HomePage() {
  const isTenantAuthenticated = useAppSelector((state) => state.tenantAuth.isAuthenticated);
  const tenantRole = useAppSelector((state) => state.tenantAuth.tenantRole);
  const hasAuthenticatedSession = isTenantAuthenticated;
  const showTenantCard = true;
  const showMemberPortalCard = !hasAuthenticatedSession;
  const tenantHomeWhenAuthed = tenantAuthenticatedHomePath(tenantRole);

  const tenantCard = isTenantAuthenticated
    ? {
        to: tenantHomeWhenAuthed,
        title: 'Your team workspace',
        description:
          'Signed in — return to your default tenant home (workspaces for admins, tasks for members).',
        cta: 'Open tenant home',
      }
    : {
        to: '/tenant/login',
        title: 'Organization workspace',
        description:
          'Register your company or sign in as the admin who owns billing and users.',
        cta: 'Admin sign-in or register',
      };

  const memberCard = {
    to: '/tenant/user/login',
    title: 'Invited team member',
    description: 'Sign in with the email and password you set when you accepted your invite.',
    cta: 'Member sign-in',
  } as const;

  return (
    <div className="from-primary/[0.08] via-background relative flex min-h-dvh flex-col overflow-x-hidden bg-gradient-to-b to-muted/25 px-3 py-3 sm:px-4 sm:py-5">
      <div
        className="home-ambient bg-primary/15 pointer-events-none absolute -top-24 left-1/2 size-[22rem] rounded-full blur-3xl sm:size-[26rem]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 pb-6 lg:gap-8 lg:pb-8">
        <header className="w-full shrink-0 text-center lg:text-left">
          <p
            className="home-reveal-up text-primary mb-1 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] lg:justify-start"
            style={{ animationDelay: '40ms' }}
          >
            <Sparkles className="size-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <span>Powered by Asteriq.in</span>
          </p>
          <h1
            className="home-reveal-up text-foreground mb-1.5 text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[1.65rem] lg:leading-tight xl:text-3xl"
            style={{ animationDelay: '110ms' }}
          >
            {hasAuthenticatedSession ? 'Welcome back,' : 'Tenant application,'}
            {'\u00A0'}
            <span className="from-primary via-primary/85 bg-gradient-to-r to-foreground/90 bg-clip-text text-transparent">
              {hasAuthenticatedSession ? 'quick links below' : 'read-first manual'}
            </span>
          </h1>
          <p
            className="home-reveal-up text-muted-foreground mx-auto max-w-2xl text-pretty text-xs leading-snug sm:text-sm lg:mx-0 lg:max-w-3xl"
            style={{ animationDelay: '180ms' }}
          >
            {hasAuthenticatedSession
              ? 'You are signed in. Use the entry card for your default home, or skim the manual for route reminders.'
              : 'This page doubles as orientation: who signs in where, what each role can do, and where billing returns land.'}
          </p>
        </header>

        <section
          id="manual-sign-in"
          aria-labelledby="manual-sign-in-heading"
          className="scroll-mt-6 space-y-4"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h2
              id="manual-sign-in-heading"
              className="text-foreground text-lg font-semibold tracking-tight sm:text-xl"
            >
              Sign-in entry points
            </h2>
            <p className="text-muted-foreground max-w-prose text-xs sm:text-sm">
              Prerequisites: a supported browser and the email your organization uses on the platform.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
            {showTenantCard || showMemberPortalCard ? (
              <div className="flex min-h-0 w-full flex-col gap-3 lg:max-w-sm lg:flex-shrink-0">
                {showTenantCard ? (
                  <Link
                    className={cn(
                      'home-reveal-card cursor-pointer focus-visible:ring-ring rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2',
                    )}
                    style={{ animationDelay: '220ms' }}
                    to={tenantCard.to}
                  >
                    <article className={cardInner}>
                      <div className="mb-1.5 inline-flex size-9 items-center justify-center rounded-xl bg-sky-500/12 text-sky-800 shadow-sm shadow-sky-500/10 dark:bg-sky-400/12 dark:text-sky-200 dark:shadow-sky-950/20 sm:size-10">
                        <Building2 className="size-[1.05rem]" aria-hidden />
                      </div>
                      <h3 className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                        {tenantCard.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-snug sm:line-clamp-2 sm:text-sm">
                        {tenantCard.description}
                      </p>
                      <span className="text-primary group-hover:text-primary/90 mt-2 inline-flex items-center gap-1.5 text-xs font-medium sm:mt-3 sm:text-sm">
                        {tenantCard.cta}
                        <ArrowRight
                          className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 sm:size-4"
                          aria-hidden
                        />
                      </span>
                    </article>
                  </Link>
                ) : null}

                {showMemberPortalCard ? (
                  <Link
                    className={cn(
                      'home-reveal-card cursor-pointer focus-visible:ring-ring rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2',
                    )}
                    style={{ animationDelay: showTenantCard ? '280ms' : '220ms' }}
                    to={memberCard.to}
                  >
                    <article className={cardInner}>
                      <div className="mb-1.5 inline-flex size-9 items-center justify-center rounded-xl bg-violet-500/12 text-violet-800 shadow-sm shadow-violet-500/10 dark:bg-violet-400/12 dark:text-violet-200 dark:shadow-violet-950/20 sm:size-10">
                        <ListTodo className="size-[1.05rem]" aria-hidden />
                      </div>
                      <h3 className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                        {memberCard.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-snug sm:line-clamp-2 sm:text-sm">
                        {memberCard.description}
                      </p>
                      <span className="text-primary group-hover:text-primary/90 mt-2 inline-flex items-center gap-1.5 text-xs font-medium sm:mt-3 sm:text-sm">
                        {memberCard.cta}
                        <ArrowRight
                          className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1 sm:size-4"
                          aria-hidden
                        />
                      </span>
                    </article>
                  </Link>
                ) : null}
              </div>
            ) : null}

            <Card className="home-reveal-up border-border/80 bg-card/70 flex min-h-0 min-w-0 flex-1 flex-col shadow-sm backdrop-blur-sm">
              <CardHeader className="flex flex-col flex-nowrap items-start gap-2 border-b border-border/50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-indigo-500/12 text-indigo-800 dark:bg-indigo-400/12 dark:text-indigo-200 inline-flex size-8 items-center justify-center rounded-lg shadow-sm shadow-indigo-500/10 dark:shadow-indigo-950/20">
                    <BookOpen className="size-4 shrink-0" aria-hidden />
                  </span>
                  <CardTitle className="text-base">On this page</CardTitle>
                </div>
                <Badge className="font-mono text-[0.6rem] tracking-wide" variant="secondary">
                  User manual
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 py-3">
                <nav aria-label="Manual table of contents">
                  <ol className="space-y-1.5 text-sm">
                    {MANUAL_TOC.map((item, index) => (
                      <li key={item.href}>
                        <a
                          className="text-primary hover:text-primary/90 inline-flex gap-2 font-medium underline-offset-4 hover:underline"
                          href={item.href}
                        >
                          <span className="text-muted-foreground font-mono text-xs tabular-nums">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
                <p className="text-muted-foreground mt-auto pt-3 font-mono text-[0.6rem] leading-relaxed">
                  Doc ref: HOME-TNT-1.0 · Orientation for the main tenant SPA
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="bg-border/60" />

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            id="manual-org-admin"
            aria-labelledby="manual-org-admin-heading"
            className="scroll-mt-6 space-y-3"
          >
            <h2 id="manual-org-admin-heading" className="text-foreground flex items-center gap-2.5 text-lg font-semibold">
              <span className="bg-blue-500/12 text-blue-800 dark:bg-blue-400/12 dark:text-blue-200 flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-blue-500/10 dark:shadow-blue-950/20">
                <Users className="size-5" aria-hidden />
              </span>
              Organization administrator
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Billing owner for the tenant. Creates workspaces, invites people, and manages subscription state visible
              in the tenant shell.
            </p>
            <ProcedureBlock
              heading="First-time setup"
              steps={[
                {
                  title: 'Create or recover access',
                  detail: 'Use Register if your company is new; use Admin sign-in if an account already exists.',
                },
                {
                  title: 'Verify email when prompted',
                  detail: 'Complete any verification link so notifications and receipts reach the right inbox.',
                },
                {
                  title: 'Land on Workspaces',
                  detail: 'After sign-in, admins default to /tenant/workspaces unless your deployment routes differently.',
                },
              ]}
            />
          </section>

          <section
            id="manual-member"
            aria-labelledby="manual-member-heading"
            className="scroll-mt-6 space-y-3"
          >
            <h2 id="manual-member-heading" className="text-foreground flex items-center gap-2.5 text-lg font-semibold">
              <span className="bg-amber-500/12 text-amber-900 dark:bg-amber-400/12 dark:text-amber-200 flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-amber-500/10 dark:shadow-amber-950/20">
                <ListTodo className="size-5" aria-hidden />
              </span>
              Invited member
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Scoped to assigned work — not the full billing and user-admin surface. Uses the member sign-in route, not
              the organization admin login.
            </p>
            <ProcedureBlock
              heading="Member access"
              steps={[
                {
                  title: 'Accept the invite',
                  detail: 'Finish the invite flow so your user record is tied to the correct tenant.',
                },
                {
                  title: 'Use Member sign-in',
                  detail: 'Bookmark /tenant/user/login — that path keeps the member portal separate from org admin auth.',
                },
                {
                  title: 'Open My tasks',
                  detail: 'Members route to /tenant/user/dashboard for their queue after authentication.',
                },
              ]}
            />
          </section>
        </div>

        <section id="manual-billing" aria-labelledby="manual-billing-heading" className="scroll-mt-6 space-y-3">
          <h2 id="manual-billing-heading" className="text-foreground flex items-center gap-2.5 text-lg font-semibold">
            <span className="bg-emerald-500/12 text-emerald-900 dark:bg-emerald-400/12 dark:text-emerald-200 flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-emerald-500/10 dark:shadow-emerald-950/20">
              <CreditCard className="size-5" aria-hidden />
            </span>
            Billing and checkout returns
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Stripe checkout sessions return the browser to first-party URLs. Operators configure plans in the admin
            console; tenants trigger upgrades inside the main app.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border/70 bg-muted/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Success return</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <code className="text-muted-foreground break-all font-mono text-xs">/billing/success</code>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  Confirms payment completion; keep this tab open until the app finishes refreshing entitlements.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-muted/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Canceled return</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <code className="text-muted-foreground break-all font-mono text-xs">/billing/cancel</code>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  User abandoned checkout — no charge. Retry upgrade from Manage subscription when ready.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="manual-workspaces" aria-labelledby="manual-workspaces-heading" className="scroll-mt-6 space-y-3">
          <h2 id="manual-workspaces-heading" className="text-foreground flex items-center gap-2.5 text-lg font-semibold">
            <span className="bg-indigo-500/12 text-indigo-900 dark:bg-indigo-400/12 dark:text-indigo-200 flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-indigo-500/10 dark:shadow-indigo-950/20">
              <Layers className="size-5" aria-hidden />
            </span>
            Workspaces and boards
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Admins manage <strong className="text-foreground font-medium">Workspaces</strong> at{' '}
            <code className="text-foreground rounded bg-muted px-1 py-0.5 font-mono text-xs">/tenant/workspaces</code>.
            Each workspace opens a board view at{' '}
            <code className="text-foreground rounded bg-muted px-1 py-0.5 font-mono text-xs">
              /tenant/workspaces/:workspaceId
            </code>
            . Members without admin privileges do not see the org-wide user directory — they stay on tasks.
          </p>
          <ProcedureBlock
            heading="Navigate as admin"
            steps={[
              {
                title: 'Pick a workspace',
                detail: 'From the list, open the workspace that matches the customer or internal initiative.',
              },
              {
                title: 'Collaborate on the board',
                detail: 'Board routes are deep-linkable; share the URL with teammates who already have access.',
              },
              {
                title: 'Manage people centrally',
                detail: 'Use /tenant/users when you need to add, remove, or audit org users (admin-only).',
              },
            ]}
          />
        </section>

        <section
          id="manual-conventions"
          aria-labelledby="manual-conventions-heading"
          className="scroll-mt-6 space-y-3"
        >
          <h2 id="manual-conventions-heading" className="text-foreground flex items-center gap-2.5 text-lg font-semibold">
            <span className="bg-slate-500/12 text-slate-800 dark:bg-slate-400/12 dark:text-slate-200 flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-slate-500/10 dark:shadow-slate-950/30">
              <Library className="size-5" aria-hidden />
            </span>
            Conventions and support
          </h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm leading-relaxed">
            <li>
              <span className="text-foreground font-medium">Two SPAs:</span> this app is the tenant-facing experience;
              platform operators use the separate admin application for catalog and fleet controls.
            </li>
            <li>
              <span className="text-foreground font-medium">Session discipline:</span> signing out clears tenant
              context — use the profile menu’s log out action before switching accounts on a shared machine.
            </li>
            <li>
              <span className="text-foreground font-medium">Need an operator?</span> Billing catalog changes and
              cross-tenant support are handled in the operator console, not inside the tenant UI.
            </li>
          </ul>
        </section>
      </div>

      <footer
        className="home-reveal-up text-muted-foreground relative z-[1] mx-auto mt-auto max-w-md shrink-0 px-2 py-2 text-center text-[0.6rem] leading-snug sm:text-[0.65rem]"
        style={{ animationDelay: '440ms' }}
      >
        Secure flows, purposeful layout, ready when you connect your systems.
      </footer>

      <SandboxCreditCardCorner />
    </div>
  );
}
