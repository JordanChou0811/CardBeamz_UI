import { computed, Injectable, signal } from '@angular/core';
import { Member } from '../models/models';
import { environment } from '../../environments/environment';
import { ReturnCodes } from './api-codes';
import { ApiError, apiErrorI18nKey, TelegramService } from './telegram.service';

const SESSION_KEY = 'cbz_session';
const TOKEN_KEY = 'cbz_token';
const USER_KEY = 'cbz_user';
const MEMBERS_KEY = 'cbz_members';

function loadUser(): Member | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Member) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentId = signal<string | null>(localStorage.getItem(SESSION_KEY));
  private readonly user = signal<Member | null>(loadUser());
  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = computed(() => this.user());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly useApi = environment.useApi;

  constructor(private api: TelegramService) {
    const id = this.currentId();
    if (id && environment.useApi) {
      void this.refreshMe(id);
    } else if (id && !environment.useApi) {
      this.refreshMeLocal(id);
    }
  }

  async login(account: string, password: string): Promise<{ ok: boolean; message?: string }> {
    if (!environment.useApi) {
      return this.loginLocal(account, password);
    }
    try {
      const res = await this.api.post<{ token: string; member: Member }>('member', 'login', {
        account,
        password,
      });
      this.persistSession(res.data.token, { ...res.data.member, password: undefined });
      return { ok: true };
    } catch (e) {
      // 依 returnCode 對應 i18n（見 api-codes.ts）
      if (e instanceof ApiError) {
        if (e.returnCode === ReturnCodes.MEMBER_LOGIN_FAILED) {
          return { ok: false, message: 'api.err.1001' }; // 1001 帳密錯誤
        }
        return { ok: false, message: apiErrorI18nKey(e, 'login.errFail') };
      }
      return { ok: false, message: 'login.errFail' };
    }
  }

  async refreshMe(memberId?: string): Promise<void> {
    const id = memberId ?? this.currentId();
    if (!id) return;
    if (!environment.useApi) {
      this.refreshMeLocal(id);
      return;
    }
    try {
      const res = await this.api.get<{ member: Member }>('member', 'me', { memberId: id });
      this.persistSession(this.token() ?? '', res.data.member);
    } catch {
      // keep cache
    }
  }

  /** 模擬模式：DataService 變更 credit 後同步 session */
  patchCurrentUser(patch: Partial<Member>): void {
    const cur = this.user();
    if (!cur) return;
    const next = { ...cur, ...patch };
    this.persistSession(this.token() ?? 'mock', next);
  }

  logout(): void {
    this.currentId.set(null);
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private loginLocal(account: string, password: string): { ok: boolean; message?: string } {
    try {
      const members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]') as Member[];
      const member = members.find((m) => m.account === account);
      if (!member) return { ok: false, message: 'login.errNoAccount' };
      if (member.password !== password) return { ok: false, message: 'login.errWrongPwd' };
      this.persistSession('mock-token', member);
      return { ok: true };
    } catch {
      return { ok: false, message: 'login.errFail' };
    }
  }

  private refreshMeLocal(id: string): void {
    try {
      const members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]') as Member[];
      const member = members.find((m) => m.id === id);
      if (member) this.persistSession('mock-token', member);
    } catch {
      // ignore
    }
  }

  private persistSession(token: string, member: Member): void {
    this.currentId.set(member.id);
    this.user.set(member);
    this.token.set(token || this.token());
    localStorage.setItem(SESSION_KEY, member.id);
    localStorage.setItem(USER_KEY, JSON.stringify(member));
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }
}
