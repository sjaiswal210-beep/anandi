import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isAuthenticated: boolean;

  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  login: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      currentWorkspace: null,
      workspaces: [],
      isAuthenticated: false,

      setUser: (user) => set({ user }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

      setWorkspaces: (workspaces) => set({ workspaces }),

      login: (data) =>
        set({
          user: data.user,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          currentWorkspace: null,
          workspaces: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'Fame Developers-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        currentWorkspace: state.currentWorkspace,
        workspaces: state.workspaces,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
