import { makeAutoObservable, runInAction } from 'mobx';
import { api, setToken, getToken } from '../api/client';
import type { AuthUser, AuthResult } from '../api/types';

const USER_KEY = 'wimb_user';

class AuthStore {
  user: AuthUser | null = null;
  initialized = false;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  get isAdmin(): boolean {
    return this.user?.isAdmin === true;
  }

  init(): void {
    try {
      const token = getToken();
      if (token) {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) {
          this.user = JSON.parse(raw) as AuthUser;
        }
        this.refresh();
      }
    } catch {
      this.user = null;
    }
    this.initialized = true;
    window.addEventListener('wimb:unauthorized', this.onUnauthorized);
  }

  async refresh(): Promise<void> {
    try {
      const fresh = await api.me();
      this.user = fresh;
      try { localStorage.setItem(USER_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
    } catch {
      this.user = null;
      setToken(null);
      try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
    }
  }

  private onUnauthorized = (): void => {
    this.user = null;
    setToken(null);
    try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
  };

  async login(login: string, password: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const result = await api.login({ login, password });
      this.setSession(result);
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Ошибка входа';
      });
      throw e;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async register(login: string, email: string, password: string, fullName: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const result = await api.register({ login, email, password, fullName });
      this.setSession(result);
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Ошибка регистрации';
      });
      throw e;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  private setSession(result: AuthResult): void {
    this.user = result.user;
    setToken(result.token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    } catch { /* ignore */ }
  }

  logout(): void {
    try {
      api.trackEvent('auth.logout').catch(() => {
        /* ignore */
      });
    } catch {
      /* ignore */
    }
    this.user = null;
    setToken(null);
    try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
  }
}

export const authStore = new AuthStore();