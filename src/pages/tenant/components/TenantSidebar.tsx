import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Rows3,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TenantDetailsDialogScope } from '@/pages/tenant/components';
import {
  tenantUserAvatarInitial,
  tenantUserPrimaryLabel,
} from '@/lib/tenant/tenantIdentityDisplay';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

type TenantNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

interface TenantSidebarProps {
  displayName: string | null;
  email: string | null;
  organizationName: string | null;
  isTenantProfileLoading?: boolean;
  tenantRole: 'admin' | 'member' | null;
  isLogoutPending?: boolean;
  /** Open profile / tenant details dialog (`accountOnly` for members). */
  onOpenProfile: (scope: TenantDetailsDialogScope) => void;
  onManageSubscription: () => void;
  onLogout: () => void;
}

export function TenantSidebar({
  displayName,
  email,
  organizationName,
  isTenantProfileLoading = false,
  tenantRole,
  isLogoutPending = false,
  onOpenProfile,
  onManageSubscription,
  onLogout,
}: TenantSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const isMember = tenantRole === 'member';
  const navItems: TenantNavItem[] = isMember
    ? [
        {
          label: 'My tasks',
          to: '/tenant/user/dashboard',
          icon: LayoutDashboard,
        },
      ]
    : [
        {
          label: 'Workspaces',
          to: '/tenant/workspaces',
          icon: Layers,
        },
        {
          label: 'Users',
          to: '/tenant/users',
          icon: Users,
        },
      ];
  const primaryLabel = tenantUserPrimaryLabel(displayName, email, 'Tenant account');
  const avatarInitial = tenantUserAvatarInitial(displayName, email);
  /** Shown under the display name so sign-in email stays visible when a name is set. */
  const secondaryLine =
    displayName?.trim() && email?.trim() ? email.trim() : null;

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto py-2"
              size="lg"
              asChild={false}
            >
              <span className="bg-primary/14 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Rows3 className="size-4" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 leading-tight">
                <span className="truncate font-semibold tracking-tight" title={organizationName ?? undefined}>
                  {isTenantProfileLoading && !organizationName?.trim()
                    ? 'Loading workspace…'
                    : (organizationName?.trim() ?? 'Your workspace')}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium uppercase tracking-wider">
                  <Building2 className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">Team hub</span>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                      className={({ isActive }) =>
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
                      }
                    >
                      <item.icon aria-hidden />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto py-2"
                  size="lg"
                >
                  <span className="bg-primary/14 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {avatarInitial}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5 leading-tight">
                    <span className="truncate text-sm font-medium" title={primaryLabel}>
                      {primaryLabel}
                    </span>
                    {secondaryLine !== null ? (
                      <span className="text-muted-foreground truncate text-xs" title={secondaryLine}>
                        {secondaryLine}
                      </span>
                    ) : null}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64"
                side="top"
                sideOffset={8}
              >
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-foreground text-sm font-semibold leading-none">Tenant menu</p>
                  <p className="text-muted-foreground truncate text-xs" title={secondaryLine ?? primaryLabel}>
                    {secondaryLine ?? primaryLabel}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      onOpenProfile(isMember ? 'accountOnly' : 'full');
                    }}
                  >
                    <UserRound aria-hidden />
                    {isMember ? 'Profile' : 'Tenant details'}
                  </DropdownMenuItem>
                  {!isMember ? (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        onManageSubscription();
                      }}
                    >
                      <CreditCard aria-hidden />
                      Manage subscription
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  aria-busy={isLogoutPending}
                  disabled={isLogoutPending}
                  onSelect={(e) => {
                    e.preventDefault();
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
