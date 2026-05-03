import {
  Building2,
  ChevronDown,
  CreditCard,
  House,
  Loader2,
  LogOut,
  Rows3,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  tenantUserAvatarInitial,
  tenantUserPrimaryLabel,
} from '@/lib/tenant/tenantIdentityDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TenantHeaderProps {
  displayName: string | null;
  email: string | null;
  organizationName: string | null;
  isLogoutPending?: boolean;
  onOpenDetails: () => void;
  onManageSubscription: () => void;
  onLogout: () => void;
}

export function TenantHeader({
  displayName,
  email,
  organizationName,
  isLogoutPending = false,
  onOpenDetails,
  onManageSubscription,
  onLogout,
}: TenantHeaderProps) {
  const primaryLabel = tenantUserPrimaryLabel(displayName, email, 'Tenant account');
  const avatarInitial = tenantUserAvatarInitial(displayName, email);
  const secondaryLine =
    displayName?.trim() && email?.trim() ? email.trim() : null;

  return (
    <div className="sticky top-3 z-20 px-3 sm:px-6">
      <header className="border-border/70 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r from-background/90 via-background/80 to-muted/35 px-4 py-3.5 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-6 supports-[backdrop-filter]:bg-background/70">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="bg-primary/14 text-primary flex size-9 items-center justify-center rounded-xl">
            <Rows3 className="size-5 shrink-0" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <span className="text-foreground font-semibold tracking-tight">Your workspace</span>
            <div className="text-muted-foreground hidden items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider sm:flex">
              <Building2 className="size-3" aria-hidden />
              <span className="max-w-[14rem] truncate">{organizationName ?? 'Team hub'}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            aria-label="Home"
            asChild
            className="size-9 p-0"
            size="sm"
            title="Go to home"
            type="button"
            variant="outline"
          >
            <Link to="/">
              <House className="size-4" aria-hidden />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-9 max-w-[18rem] gap-2 px-2.5 sm:px-3"
                size="sm"
                type="button"
                variant="outline"
              >
                <span className="bg-primary/14 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold uppercase">
                  {avatarInitial}
                </span>
                <span className="hidden max-w-[9rem] truncate text-xs sm:inline" title={primaryLabel}>
                  {primaryLabel}
                </span>
                <ChevronDown className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="text-foreground text-sm font-semibold leading-none">Tenant menu</p>
                <p className="text-muted-foreground truncate text-xs" title={secondaryLine ?? primaryLabel}>
                  {secondaryLine ?? primaryLabel}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onOpenDetails();
                  }}
                >
                  <UserRound aria-hidden />
                  View tenant details
                  <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onManageSubscription();
                  }}
                >
                  <CreditCard aria-hidden />
                  Manage subscription
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                aria-busy={isLogoutPending}
                disabled={isLogoutPending}
                onSelect={(event) => {
                  event.preventDefault();
                  if (isLogoutPending) {
                    return;
                  }
                  onLogout();
                }}
              >
                {isLogoutPending ? (
                  <Loader2 aria-hidden className="animate-spin" />
                ) : (
                  <LogOut aria-hidden />
                )}
                {isLogoutPending ? 'Signing out…' : 'Log out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}
