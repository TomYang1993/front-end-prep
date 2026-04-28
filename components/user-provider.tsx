'use client';

import { createContext, useContext } from 'react';
import type { SessionPayload } from '@/lib/auth/session-cookie';

export type ClientUser = SessionPayload;

const UserContext = createContext<ClientUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: ClientUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
