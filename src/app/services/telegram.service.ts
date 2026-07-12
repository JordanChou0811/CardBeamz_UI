import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * API 客戶端。
 * - mock：讀取 /mock-data/{apid}/{opid}.json（模擬電文）
 * - api：呼叫 http://localhost:8080/api/{apid}/{opid}
 */
export interface ApiResponse<TData = unknown> {
  apid: string;
  opid: string;
  name: string;
  returnCode: string;
  returnMsg: string;
  data: TData;
}

export class ApiError extends Error {
  constructor(
    public readonly returnCode: string,
    message: string,
    public readonly response?: ApiResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  readonly useApi = environment.useApi;
  private base = environment.apiBaseUrl;

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
      throw new ApiError(
        '9998',
        this.useApi
          ? '無法連線後端，請確認已啟動 http://localhost:8080'
          : `無法讀取模擬電文：${url}`
      );
    }
    let json: ApiResponse<TData>;
    try {
      json = (await res.json()) as ApiResponse<TData>;
    } catch {
      throw new ApiError('9997', `回應格式錯誤（HTTP ${res.status}）`);
    }
    if (!res.ok || json.returnCode !== '0000') {
      throw new ApiError(json.returnCode || String(res.status), json.returnMsg || '請求失敗', json);
    }
    return json;
  }
}
