import { inject, Injectable, Injector } from '@angular/core';
import { environment } from '../../environments/environment';
import { AlertService } from './alert.service';
import { i18nKeyForReturnCode, ReturnCodes } from './api-codes';

/**
 * API 客戶端。
 * - mock：讀取 /mock-data/{apid}/{opid}.json（模擬電文）
 * - api：呼叫 http://localhost:8080/api/{apid}/{opid}
 *
 * 錯誤處理：後端回傳 returnCode（見 api-codes.ts / 後端 ReturnCodes.java），
 * 前端用 i18nKeyForReturnCode() 對應顯示文案，不要解析 returnMsg。
 */
export interface ApiResponse<TData = unknown> {
  apid: string;
  opid: string;
  name: string;
  /** 見 ReturnCodes；0000=成功 */
  returnCode: string;
  /** 後端除錯訊息（可能為中文）；UI 勿直接顯示 */
  returnMsg: string;
  data: TData;
}

export class ApiError extends Error {
  constructor(
    /** 見 ReturnCodes */
    public readonly returnCode: string,
    message: string,
    public readonly response?: ApiResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 對應的 i18n key */
  get i18nKey(): string {
    return i18nKeyForReturnCode(this.returnCode);
  }
}

/** 從未知錯誤取出 i18n key */
export function apiErrorI18nKey(e: unknown, fallback = 'api.err.unknown'): string {
  if (e instanceof ApiError) return e.i18nKey;
  return fallback;
}


@Injectable({ providedIn: 'root' })
export class TelegramService {
  readonly useApi = environment.useApi;
  private base = environment.apiBaseUrl;
  private injector = inject(Injector);

  async get<TData = unknown>(
    apid: string,
    opid: string,
    params?: Record<string, string | number | undefined | null>
  ): Promise<ApiResponse<TData>> {
    if (!this.useApi) {
      return this.requestMock<TData>(apid, opid);
    }
    const qs = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      }
    }
    const q = qs.toString();
    const url = `${this.base}/${apid}/${opid}${q ? `?${q}` : ''}`;
    return this.request<TData>(url, { method: 'GET' });
  }

  async post<TData = unknown>(
    apid: string,
    opid: string,
    body?: unknown
  ): Promise<ApiResponse<TData>> {
    if (!this.useApi) {
      return this.requestMock<TData>(apid, opid);
    }
    const url = `${this.base}/${apid}/${opid}`;
    return this.request<TData>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async call<TData = unknown>(apid: string, opid: string): Promise<ApiResponse<TData>> {
    return this.get<TData>(apid, opid);
  }

  private async requestMock<TData>(apid: string, opid: string): Promise<ApiResponse<TData>> {
    const url = `${this.base}/${apid}/${opid}.json`;
    return this.request<TData>(url, { method: 'GET' });
  }

  private async request<TData>(url: string, init: RequestInit): Promise<ApiResponse<TData>> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch {
      const err = new ApiError(
        ReturnCodes.SYSTEM_OFFLINE, // 9998 無法連線
        this.useApi
          ? '無法連線後端，請確認已啟動 http://localhost:8080'
          : `無法讀取模擬電文：${url}`
      );
      this.notifyError(err);
      throw err;
    }
    let json: ApiResponse<TData>;
    try {
      json = (await res.json()) as ApiResponse<TData>;
    } catch {
      const err = new ApiError(
        ReturnCodes.SYSTEM_BAD_RESPONSE,
        `回應格式錯誤（HTTP ${res.status}）`
      ); // 9997
      this.notifyError(err);
      throw err;
    }
    if (!res.ok || json.returnCode !== ReturnCodes.OK) {
      const err = new ApiError(
        json.returnCode || String(res.status),
        json.returnMsg || '請求失敗',
        json
      );
      this.notifyError(err);
      throw err;
    }
    return json;
  }

  /** 全站錯誤跳窗（lazy inject，避免循環相依） */
  private notifyError(err: ApiError): void {
    try {
      void this.injector.get(AlertService).error(err.i18nKey);
    } catch {
      // ignore
    }
  }
}
