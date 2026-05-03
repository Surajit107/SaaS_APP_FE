import { Briefcase, Building2, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export type TenantAuthPortalFooterVariant = 'admin-login' | 'member-login' | 'register';

type TenantAuthPortalFooterProps = {
  variant: TenantAuthPortalFooterVariant;
};

/** Outline actions for org login/register footers — tenant SPA routes only. */
const authFooterNavButtonClass =
  'border-primary/15 from-primary/[0.06] to-background/80 text-foreground hover:border-primary/30 hover:from-primary/[0.12] inline-flex h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap px-2 text-[11px] font-semibold shadow-sm sm:h-10 sm:gap-2 sm:px-2.5 sm:text-xs';

const portalPairClass =
  'inline-flex h-auto min-h-9 w-full items-center justify-center gap-2 px-3 py-2 text-center text-xs font-semibold sm:min-h-10 sm:text-sm';

export function TenantAuthPortalFooter({ variant }: TenantAuthPortalFooterProps) {
  return (
    <div className="relative z-10">
      <Separator className="mx-4 sm:mx-8" />
      <div className="space-y-2.5 px-4 pb-4 pt-3 sm:space-y-3 sm:px-8 sm:pb-5 sm:pt-3.5">
        {variant === 'admin-login' ? (
          <>
            <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
              <Button asChild className={authFooterNavButtonClass} size="sm" variant="outline">
                <Link to="/tenant/user/login">
                  <UserCircle2 aria-hidden className="size-3.5 shrink-0 text-primary sm:size-4" />
                  Member sign-in
                </Link>
              </Button>
              <Button asChild className={authFooterNavButtonClass} size="sm" variant="outline">
                <Link to="/tenant/register">
                  <Building2 aria-hidden className="size-3.5 shrink-0 text-primary sm:size-4" />
                  Create organization
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mx-auto max-w-md text-center text-[10px] leading-snug sm:text-[11px]">
              Use of this product is under your agreement with the platform owner. Admins manage
              users and billing; commercial questions go to whoever purchased or sponsors your
              deployment.
            </p>
          </>
        ) : null}

        {variant === 'member-login' ? (
          <>
            <div className="mx-auto w-full max-w-md">
              <Button
                asChild
                className={`${authFooterNavButtonClass} w-full`}
                size="sm"
                variant="outline"
              >
                <Link className="w-full justify-center" to="/tenant/login">
                  <Briefcase aria-hidden className="size-3.5 shrink-0 text-primary sm:size-4" />
                  Admin sign-in
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mx-auto max-w-md text-center text-[10px] leading-snug sm:text-[11px]">
              Invitations and resets come from your organization&apos;s admins. Subscription matters sit
              between your organization and the platform owner.
            </p>
          </>
        ) : null}

        {variant === 'register' ? (
          <>
            <p className="text-muted-foreground text-center text-[11px] font-medium leading-snug sm:text-xs">
              Already have a workspace under your organization&apos;s subscription?
            </p>
            <div className="mx-auto grid max-w-lg grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
              <Button asChild className={portalPairClass} size="sm" variant="outline">
                <Link to="/tenant/login">
                  <Briefcase aria-hidden className="size-4 shrink-0 text-primary" />
                  Admin sign-in
                </Link>
              </Button>
              <Button asChild className={portalPairClass} size="sm" variant="outline">
                <Link to="/tenant/user/login">
                  <UserCircle2 aria-hidden className="size-4 shrink-0 text-primary" />
                  Member sign-in
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mx-auto max-w-md text-center text-[10px] leading-snug sm:text-[11px]">
              Commercial terms are between your company and the provider; this registration creates your
              tenant workspace only.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
