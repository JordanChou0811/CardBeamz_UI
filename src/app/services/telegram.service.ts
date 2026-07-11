import { Injectable } from '@angular/core';

/**
 * 模擬 API 服務。
 * 每支 API 以「功能 / 動作」分層存放於 /mock-data/{apid}/{opid}.json：
 *   - apid = 功能（一支 API），例如 member、warehouse、order…（資料夾）
 *   - opid = 該功能底下的動作，例如 login、register、checkout…（檔案）
 * 每個 JSON 檔的內容就是該 API 的 Response（回應內容）。
 */
export interface ApiResponse<TData = unknown> {
  /** 功能代號（資料夾名） */
  apid: string;
  /** 動作代號（檔名） */
  opid: string;
  /** 動作名稱 */
  name: string;
  /** 回應碼，0000 代表成功 */
  returnCode: string;
  /** 回應訊息 */
  returnMsg: string;
  /** 實際資料 */
  data: TData;
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private base = 'mock-data';

  /**
   * 呼叫一支模擬 API，回傳對應的 Response。
   * @param apid 功能（資料夾），例如 'member'
   * @param opid 動作（檔名），例如 'login'
   */
  async call<TData = unknown>(apid: string, opid: string): Promise<ApiResponse<TData>> {
    const url = `${this.base}/${apid}/${opid}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API 不存在：${apid}/${opid}`);
    }
    return (await res.json()) as ApiResponse<TData>;
  }
}
