import { Injectable, signal } from '@angular/core';

export interface AlertRequest {
  /** i18n key，預設 alert.error */
  title?: string;
  /** i18n key：錯誤內容 */
  message: string;
  /** 可選的補充說明（已翻譯／原文，不加 t） */
  detail?: string;
}

interface PendingAlert extends Required<Pick<AlertRequest, 'title' | 'message'>> {
  detail?: string;
  resolve: () => void;
}

/**
 * 全站錯誤／提示跳窗。用法：
 *   await alert.error('groups.errRequired');
 * API 錯誤由 TelegramService 自動呼叫，頁面不必再 catch 顯示。
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  readonly pending = signal<PendingAlert | null>(null);

  show(req: AlertRequest): Promise<void> {
    return new Promise<void>((resolve) => {
      const prev = this.pending();
      if (prev) prev.resolve();
      this.pending.set({
        title: req.title ?? 'alert.error',
        message: req.message,
        detail: req.detail,
        resolve,
      });
    });
  }

  error(messageKey: string, detail?: string): Promise<void> {
    return this.show({ message: messageKey, detail });
  }

  dismiss(): void {
    const p = this.pending();
    if (!p) return;
    this.pending.set(null);
    p.resolve();
  }
}
