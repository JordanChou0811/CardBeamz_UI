import { computed, Injectable, signal } from '@angular/core';
import { Member } from '../models/models';
import { DataService } from './data.service';

const SESSION_KEY = 'cbz_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentId = signal<string | null>(localStorage.getItem(SESSION_KEY));

  readonly currentUser = computed<Member | null>(() => {
    const id = this.currentId();
    if (!id) return null;
    return this.data.members().find((m) => m.id === id) ?? null;
  });

  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private data: DataService) {}

  login(account: string, password: string): { ok: boolean; message?: string } {
    const member = this.data.findByAccount(account);
    if (!member) return { ok: false, message: 'login.errNoAccount' };
    if (member.password !== password) return { ok: false, message: 'login.errWrongPwd' };
    this.currentId.set(member.id);
    localStorage.setItem(SESSION_KEY, member.id);
    return { ok: true };
  }

  logout(): void {
    this.currentId.set(null);
    localStorage.removeItem(SESSION_KEY);
  }
}
