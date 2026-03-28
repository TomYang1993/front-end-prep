'use client';

import { createContext, useContext } from 'react';

export interface ClientUser {
  id: string;
  email: string;
  roles: string[];
}

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
