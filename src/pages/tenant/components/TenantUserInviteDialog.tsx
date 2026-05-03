import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  tenantUserAdminInviteFlowRequested,
  tenantUserAdminInviteSheetClosed,
} from '@/features/tenant/slice/tenantUserAdminSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function TenantUserInviteDialog() {
  const dispatch = useAppDispatch();
  const { inviteOpen, inviteSubmitting } = useAppSelector((s) => s.tenantUserAdmin);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  useEffect(() => {
    if (inviteOpen) {
      setEmail('');
      setDisplayName('');
      setRole('member');
    }
  }, [inviteOpen]);

  const handleOpenChange = (open: boolean): void => {
    if (!open && !inviteSubmitting) {
      dispatch(tenantUserAdminInviteSheetClosed());
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length === 0) {
      return;
    }
    const trimmedName = displayName.trim();
    dispatch(
      tenantUserAdminInviteFlowRequested({
        email: trimmedEmail,
        ...(trimmedName.length > 0 ? { displayName: trimmedName } : {}),
        role,
      }),
    );
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={inviteOpen}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Sends an email invitation. They choose a password from the link before they can sign
              in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <label className="text-foreground text-xs font-medium" htmlFor="invite-email">
                Email
              </label>
              <Input
                autoComplete="email"
                disabled={inviteSubmitting}
                id="invite-email"
                inputMode="email"
                onChange={(ev) => {
                  setEmail(ev.target.value);
                }}
                placeholder="colleague@company.com"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-foreground text-xs font-medium" htmlFor="invite-display">
                Display name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                disabled={inviteSubmitting}
                id="invite-display"
                maxLength={120}
                onChange={(ev) => {
                  setDisplayName(ev.target.value);
                }}
                placeholder="Jane Doe"
                type="text"
                value={displayName}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="text-foreground text-xs font-medium" id="invite-role-label">
                Role
              </span>
              <Select
                disabled={inviteSubmitting}
                onValueChange={(value) => {
                  setRole(value === 'admin' ? 'admin' : 'member');
                }}
                value={role}
              >
                <SelectTrigger aria-labelledby="invite-role-label" id="invite-role">
                  <SelectValue placeholder="Choose role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2 flex flex-row justify-end gap-3 border-t border-border/60 pt-4">
            <DialogClose asChild>
              <Button disabled={inviteSubmitting} type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={inviteSubmitting || email.trim().length === 0} type="submit">
              {inviteSubmitting ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
