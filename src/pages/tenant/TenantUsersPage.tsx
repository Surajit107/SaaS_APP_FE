import { useEffect, useRef, useState } from 'react';
import {
  BadgeAlert,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Mail,
  PanelRight,
  PauseCircle,
  Search,
  Shield,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { buildPaginationItems } from '@/lib/pagination/buildPaginationItems';
import { tenantUserListSyncFlowRequested } from '@/features/tenant/saga/tenantUserListSaga';
import {
  tenantUserAdminDetailSyncRequested,
  tenantUserAdminInviteSheetOpened,
} from '@/features/tenant/slice/tenantUserAdminSlice';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { tenantUserPrimaryLabel } from '@/lib/tenant/tenantIdentityDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantUserDetailSheet } from '@/pages/tenant/components/TenantUserDetailSheet';
import { TenantUserInviteDialog } from '@/pages/tenant/components/TenantUserInviteDialog';
import { TenantUserListSkeleton } from '@/pages/tenant/components/TenantUserListSkeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';

const TENANT_USER_SEARCH_DEBOUNCE_MS = 400;

export function TenantUsersPage() {
  const dispatch = useAppDispatch();
  const tenantRole = useAppSelector((s) => s.tenantAuth.tenantRole);
  const currentUserId = useAppSelector((s) => s.tenantAuth.userId);
  const {
    users,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    params,
  } = useAppSelector((s) => s.tenantUserList);

  const [searchInput, setSearchInput] = useState(
    () => store.getState().tenantUserList.params.searchQuery,
  );
  const debouncedSearch = useDebouncedValue(searchInput, TENANT_USER_SEARCH_DEBOUNCE_MS);
  const skipDebouncedSyncRef = useRef(true);

  useEffect(() => {
    dispatch(tenantUserListSyncFlowRequested({}));
  }, [dispatch]);

  useEffect(() => {
    if (skipDebouncedSyncRef.current) {
      skipDebouncedSyncRef.current = false;
      return;
    }
    dispatch(
      tenantUserListSyncFlowRequested({
        searchQuery: debouncedSearch.trim(),
        page: 1,
      }),
    );
  }, [debouncedSearch, dispatch]);

  const handleClearSearch = (): void => {
    setSearchInput('');
    dispatch(
      tenantUserListSyncFlowRequested({
        searchQuery: '',
        page: 1,
      }),
    );
  };

  const goToPage = (nextPage: number): void => {
    if (nextPage < 1 || nextPage > totalPages || isLoading) {
      return;
    }
    dispatch(tenantUserListSyncFlowRequested({ page: nextPage }));
  };

  if (tenantRole === 'member') {
    return <Navigate replace to="/tenant/user/dashboard" />;
  }

  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);
  const effectiveTotalPages = Math.max(totalPages, 1);
  const paginationItems = buildPaginationItems(page, effectiveTotalPages);
  const showPaginationFooter = error === null && (total > 0 || users.length > 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6">
      <TenantUserInviteDialog />
      <TenantUserDetailSheet />
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          All org accounts, including yours — your row is labeled{' '}
          <span className="text-foreground font-medium">You</span>. Tenant admins only.
        </p>
      </div>

      <section className="border-border/70 rounded-2xl border bg-card/95 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <label className="text-foreground mb-1.5 block text-xs font-medium" htmlFor="tenant-user-search">
              Search by email or name
            </label>
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <input
                className="border-border/70 bg-muted/25 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus-visible:ring-2"
                id="tenant-user-search"
                maxLength={200}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                }}
                placeholder="Type to filter…"
                type="search"
                value={searchInput}
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              onClick={() => {
                dispatch(tenantUserAdminInviteSheetOpened());
              }}
              type="button"
            >
              <UserPlus className="mr-1.5 size-4" aria-hidden />
              Invite user
            </Button>
            <Button
              disabled={searchInput.length === 0 && params.searchQuery.length === 0}
              onClick={handleClearSearch}
              type="button"
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
      </section>

      {error !== null ? (
        <section className="border-destructive/40 bg-destructive/10 rounded-xl border px-4 py-3 text-sm shadow-sm">
          <p className="text-destructive font-medium">{error}</p>
          <Button
            className="mt-3"
            onClick={() => {
              dispatch(tenantUserListSyncFlowRequested({}));
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </section>
      ) : null}

      <section className="border-border/70 overflow-hidden rounded-2xl border bg-card/95 shadow-sm">
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
          <p className="text-muted-foreground inline-flex items-center gap-2 text-xs sm:text-sm">
            <Users aria-hidden className="text-muted-foreground/80 size-4 shrink-0" />
            {isLoading && users.length === 0 ? (
              <Skeleton aria-hidden className="inline-block h-4 w-[min(18rem,100%)] max-w-full" />
            ) : isLoading ? (
              <span className="text-muted-foreground/90">Refreshing list…</span>
            ) : (
              <span>
                {total === 0
                  ? 'No users match your filters.'
                  : `Showing ${startIndex}–${endIndex} of ${total}`}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Previous page"
              disabled={page <= 1 || isLoading || totalPages <= 1}
              onClick={() => {
                goToPage(page - 1);
              }}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground min-w-[5.5rem] text-center text-xs tabular-nums sm:text-sm">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <Button
              aria-label="Next page"
              disabled={page >= totalPages || isLoading || totalPages <= 1}
              onClick={() => {
                goToPage(page + 1);
              }}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="divide-border/60 divide-y">
          {isLoading && users.length === 0 ? <TenantUserListSkeleton /> : null}
          {!isLoading && users.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm sm:px-5">
              <UserRound aria-hidden className="text-muted-foreground/50 size-8" />
              <span>No users to display.</span>
            </div>
          ) : null}
          {users.map((user) => {
            const isCurrentUser =
              currentUserId !== null && user.id === currentUserId;
            const userHasDisplayName = Boolean(user.displayName?.trim());
            return (
            <div
              className={
                isCurrentUser
                  ? 'hover:bg-muted/30 bg-primary/[0.06] border-primary/35 flex flex-col gap-1 border-l-2 px-4 py-3 pl-[calc(1rem-2px)] transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pl-[calc(1.25rem-2px)]'
                  : 'hover:bg-muted/30 flex flex-col gap-1 px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-5'
              }
              key={user.id}
            >
              <div className="flex min-w-0 flex-1 gap-3 sm:items-start">
                <CircleUser
                  aria-hidden
                  className="text-muted-foreground/80 mt-0.5 size-4 shrink-0 sm:size-[1.125rem]"
                />
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="text-foreground truncate text-sm font-medium">
                      {tenantUserPrimaryLabel(user.displayName, user.email, '—')}
                    </p>
                    {isCurrentUser ? (
                      <span
                        className="bg-primary/15 text-primary inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
                        title="Signed-in account"
                      >
                        <UserRound aria-hidden className="size-3" />
                        You
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {userHasDisplayName ? (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                        <Mail aria-hidden className="size-3 shrink-0 opacity-70" />
                        <span className="truncate">{user.email}</span>
                      </span>
                    ) : null}
                    {user.createdAt !== undefined ? (
                      <span className="text-muted-foreground/80 inline-flex items-center gap-1">
                        <Calendar aria-hidden className="size-3 shrink-0 opacity-70" />
                        <span>
                          Joined{' '}
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <span
                  className={
                    user.role === 'admin'
                      ? 'bg-primary/12 text-primary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium'
                      : 'bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium'
                  }
                >
                  {user.role === 'admin' ? (
                    <Shield aria-hidden className="size-3.5 shrink-0" />
                  ) : (
                    <UserRound aria-hidden className="size-3.5 shrink-0" />
                  )}
                  {user.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                <span
                  className={
                    user.isActive
                      ? 'inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'
                      : 'inline-flex items-center gap-1 rounded-md bg-amber-500/12 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300'
                  }
                >
                  {user.isActive ? (
                    <CheckCircle2 aria-hidden className="size-3.5 shrink-0" />
                  ) : (
                    <PauseCircle aria-hidden className="size-3.5 shrink-0" />
                  )}
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  {user.isEmailVerified ? (
                    <BadgeCheck aria-hidden className="size-3.5 shrink-0 text-emerald-600/90 dark:text-emerald-400/90" />
                  ) : (
                    <BadgeAlert aria-hidden className="size-3.5 shrink-0 text-amber-600/90 dark:text-amber-400/90" />
                  )}
                  {user.isEmailVerified ? 'Verified' : 'Unverified'}
                </span>
                <Button
                  onClick={() => {
                    dispatch(tenantUserAdminDetailSyncRequested({ userId: user.id }));
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PanelRight aria-hidden className="mr-1 size-3.5" />
                  Details
                </Button>
              </div>
            </div>
            );
          })}
        </div>

        {showPaginationFooter ? (
          <div className="border-border/60 bg-muted/5 border-t px-3 py-3 sm:px-5">
            <Pagination>
              <PaginationContent className="justify-center">
                <PaginationItem>
                  <PaginationPrevious
                    disabled={page <= 1 || isLoading || effectiveTotalPages <= 1}
                    onClick={() => {
                      goToPage(page - 1);
                    }}
                  />
                </PaginationItem>
                {paginationItems.map((item, itemIndex) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${itemIndex}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        aria-label={`Page ${item}`}
                        disabled={isLoading}
                        isActive={item === page}
                        onClick={() => {
                          goToPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    disabled={page >= effectiveTotalPages || isLoading || effectiveTotalPages <= 1}
                    onClick={() => {
                      goToPage(page + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </section>
    </div>
  );
}
