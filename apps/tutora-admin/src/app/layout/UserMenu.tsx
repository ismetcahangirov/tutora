import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuthStore, useAuthUser } from '@features/auth';
import { getInitials } from '@shared/utils/initials';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';

/** Topbar account menu — identity summary and sign-out. */
export function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthUser();
  const signOut = useAuthStore((state) => state.signOut);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('user.menu')}>
          <Avatar>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="flex flex-col">
            <span className="truncate text-sm font-semibold">{user.name ?? user.email}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut />
          {t('user.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
