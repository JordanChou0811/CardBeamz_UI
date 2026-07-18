import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message?: string;
  /** 確認按鈕文案 i18n key，預設 common.delete */
  confirmKey?: string;
  /** 確認按鈕樣式：danger | primary，預設 danger */
  confirmTone?: 'danger' | 'primary';
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (ok: boolean) => void;
}

/**
 * 全站確認跳窗。用法：
 *   const ok = await confirm.ask({ title: 'confirm.deleteGroup', message: name });
 *   if (!ok) return;
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(req: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // 若已有未完成的確認，先取消前一個
      const prev = this.pending();
      if (prev) prev.resolve(false);
      this.pending.set({
        title: req.title,
        message: req.message,
        confirmKey: req.confirmKey ?? 'common.delete',
        confirmTone: req.confirmTone ?? 'danger',
        resolve,
      });
    });
  }

  accept(): void {
    const p = this.pending();
    if (!p) return;
    this.pending.set(null);
    p.resolve(true);
  }

  dismiss(): void {
    const p = this.pending();
    if (!p) return;
    this.pending.set(null);
    p.resolve(false);
  }
}
