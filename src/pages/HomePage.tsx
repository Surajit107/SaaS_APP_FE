import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ListTodo, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { SandboxCreditCardCorner } from '@/pages/home/SandboxCreditCardCorner';

const cardInner =
  'bg-card hover:border-primary/40 group flex flex-col rounded-2xl border border-border p-3 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-4';

export function HomePage() {
  const isTenantAuthenticated = useAppSelector((state) => state.tenantAuth.isAuthenticated);
  const hasAuthenticatedSession = isTenantAuthenticated;
  const showTenantCard = true;
  const showMemberPortalCard = !hasAuthenticatedSession;

  const tenantCard = isTenantAuthenticated
    ? {
        to: '/tenant/workspaces',
        title: 'Your team workspace',
        description:
          'Signed in as a tenant — jump back into billing, people, and work.',
        cta: 'Open tenant dashboard',
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

  const audienceCardCount = Number(showTenantCard) + Number(showMemberPortalCard);

  return (
    <div className="from-primary/[0.08] via-background relative flex min-h-dvh flex-col overflow-x-hidden bg-gradient-to-b to-muted/25 px-3 py-3 sm:px-4 sm:py-4 lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <div
        className="home-ambient bg-primary/15 pointer-events-none absolute -top-24 left-1/2 size-[22rem] rounded-full blur-3xl sm:size-[26rem]"
        aria-hidden
      />
      <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-3 lg:min-h-0 lg:gap-4 lg:py-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5 xl:gap-6">
          <header className="w-full shrink-0 text-center lg:max-w-[14rem] lg:pt-1 lg:text-left xl:max-w-[16rem]">
            <p
              className="home-reveal-up text-primary mb-1 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] lg:justify-start"
              style={{ animationDelay: '40ms' }}
            >
              <Sparkles className="size-3 shrink-0" aria-hidden />
              <span>Powered by Asteriq.in</span>
            </p>
            <h1
              className="home-reveal-up text-foreground mb-1.5 text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[1.65rem] lg:leading-tight xl:text-3xl"
              style={{ animationDelay: '110ms' }}
            >
              {hasAuthenticatedSession ? 'Welcome back,' : 'One product,'}
              {'\u00A0'}
              <span className="from-primary via-primary/85 bg-gradient-to-r to-foreground/90 bg-clip-text text-transparent">
                {hasAuthenticatedSession
                  ? 'pick up where you left off'
                  : 'two thoughtful paths'}
              </span>
            </h1>
            <p
              className="home-reveal-up text-muted-foreground text-pretty text-xs leading-snug sm:text-sm lg:max-w-none"
              style={{ animationDelay: '180ms' }}
            >
              {hasAuthenticatedSession
                ? 'Your session is active — go straight to your dashboard.'
                : 'Organization admins and invited teammates each get an entry that fits.'}
            </p>
          </header>

          <div className="min-w-0 flex-1">
            {showTenantCard || showMemberPortalCard ? (
              <div
                className={cn(
                  'grid w-full gap-3',
                  audienceCardCount === 2 && 'sm:grid-cols-2',
                  audienceCardCount === 1 && 'mx-auto max-w-xl sm:mx-0 sm:max-w-none sm:grid-cols-1',
                )}
              >
                {showTenantCard ? (
                    <Link
                      className={cn(
                        'home-reveal-card cursor-pointer focus-visible:ring-ring rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2',
                      )}
                      style={{
                        animationDelay: '220ms',
                      }}
                      to={tenantCard.to}
                    >
                      <article className={cardInner}>
                        <div className="bg-primary/12 text-primary mb-1.5 inline-flex size-9 items-center justify-center rounded-xl sm:size-10">
                          <Building2 className="size-[1.05rem]" aria-hidden />
                        </div>
                        <h2 className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                          {tenantCard.title}
                        </h2>
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
                      style={{
                        animationDelay: showTenantCard ? '300ms' : '220ms',
                      }}
                      to={memberCard.to}
                    >
                      <article className={cardInner}>
                        <div className="bg-primary/12 text-primary mb-1.5 inline-flex size-9 items-center justify-center rounded-xl sm:size-10">
                          <ListTodo className="size-[1.05rem]" aria-hidden />
                        </div>
                        <h2 className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                          {memberCard.title}
                        </h2>
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
          </div>
        </div>
      </div>

      <footer
        className="home-reveal-up text-muted-foreground relative z-[1] mx-auto mt-auto max-w-md shrink-0 px-2 py-1.5 text-center text-[0.6rem] leading-snug sm:text-[0.65rem]"
        style={{ animationDelay: '440ms' }}
      >
        Secure flows, purposeful layout, ready when you connect your systems.
      </footer>

      <SandboxCreditCardCorner />
    </div>
  );
}
