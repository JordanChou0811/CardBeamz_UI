import { Injectable, signal } from '@angular/core';
import {
  Group,
  Member,
  NewsItem,
  Order,
  ShippingInfo,
  SHIPPING_FEE,
  WarehouseItem,
} from '../models/models';

const KEYS = {
  members: 'cbz_members',
  items: 'cbz_items',
  orders: 'cbz_orders',
  news: 'cbz_news',
  groups: 'cbz_groups',
  seq: 'cbz_member_seq',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

let uid = 0;
function newId(prefix: string): string {
  uid += 1;
  return `${prefix}_${Date.now().toString(36)}_${uid}`;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly members = signal<Member[]>([]);
  readonly items = signal<WarehouseItem[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly news = signal<NewsItem[]>([]);
  readonly groups = signal<Group[]>([]);

  constructor() {
    this.seedIfEmpty();
    this.members.set(load<Member[]>(KEYS.members, []));
    this.items.set(load<WarehouseItem[]>(KEYS.items, []));
    this.orders.set(load<Order[]>(KEYS.orders, []));
    this.news.set(load<NewsItem[]>(KEYS.news, []));
    this.groups.set(load<Group[]>(KEYS.groups, []));
  }

  // ----- 會員編號 -----
  private nextMemberNo(): string {
    const seq = load<number>(KEYS.seq, 0) + 1;
    save(KEYS.seq, seq);
    return 'CBZ' + seq.toString().padStart(7, '0');
  }

  // ----- 會員 -----
  findByAccount(account: string): Member | undefined {
    return this.members().find((m) => m.account === account);
  }

  findMember(id: string): Member | undefined {
    return this.members().find((m) => m.id === id);
  }

  createMember(data: { account: string; name: string; password: string }): Member {
    const member: Member = {
      id: this.nextMemberNo(),
      account: data.account,
      name: data.name,
      password: data.password,
      credit: 0,
      role: 'member',
      createdAt: new Date().toISOString(),
    };
    const next = [...this.members(), member];
    this.members.set(next);
    save(KEYS.members, next);
    return member;
  }

  updateMember(id: string, patch: Partial<Member>): void {
    const next = this.members().map((m) => (m.id === id ? { ...m, ...patch } : m));
    this.members.set(next);
    save(KEYS.members, next);
  }

  addCredit(memberId: string, amount: number): void {
    const m = this.findMember(memberId);
    if (!m) return;
    this.updateMember(memberId, { credit: m.credit + amount });
  }

  // ----- 倉庫 -----
  itemsOf(memberId: string): WarehouseItem[] {
    return this.items().filter((i) => i.memberId === memberId);
  }

  warehouseItems(memberId: string): WarehouseItem[] {
    return this.itemsOf(memberId).filter((i) => i.status === 'in_warehouse');
  }

  private setItemStatus(ids: string[], status: WarehouseItem['status']): void {
    const now = new Date().toISOString();
    const next = this.items().map((i) =>
      ids.includes(i.id) ? { ...i, status, updatedAt: now } : i
    );
    this.items.set(next);
    save(KEYS.items, next);
  }

  /** 後台分派卡片給會員（一次可發多張），狀態為 in_warehouse */
  assignItems(
    memberId: string,
    card: {
      name: string;
      photo: string;
      exchangeValue: number;
      cardName?: string;
      cardNo?: string;
    },
    quantity = 1
  ): WarehouseItem[] {
    const now = new Date().toISOString();
    const created: WarehouseItem[] = [];
    const count = Math.max(1, Math.floor(quantity) || 1);
    for (let i = 0; i < count; i += 1) {
      created.push({
        id: newId('ITEM'),
        memberId,
        cbz: card.name,
        cardName: card.cardName?.trim() || undefined,
        cardNo: card.cardNo?.trim() || undefined,
        groupPhoto: card.photo,
        exchangeValue: card.exchangeValue,
        status: 'in_warehouse',
        updatedAt: now,
      });
    }
    const next = [...this.items(), ...created];
    this.items.set(next);
    save(KEYS.items, next);
    return created;
  }

  /** 後台收回（刪除）一張卡片 */
  removeItem(itemId: string): void {
    const next = this.items().filter((i) => i.id !== itemId);
    this.items.set(next);
    save(KEYS.items, next);
  }

  recycle(itemId: string): void {
    this.setItemStatus([itemId], 'recycled');
  }

  exchange(itemId: string): void {
    const item = this.items().find((i) => i.id === itemId);
    if (!item) return;
    this.setItemStatus([itemId], 'exchanged');
    this.addCredit(item.memberId, item.exchangeValue);
  }

  // ----- 訂單 -----
  ordersOf(memberId: string): Order[] {
    return this.orders().filter((o) => o.memberId === memberId);
  }

  checkout(memberId: string, itemIds: string[], shipping: ShippingInfo): Order {
    const items = this.items().filter((i) => itemIds.includes(i.id));
    const order: Order = {
      id: newId('ORD'),
      memberId,
      items: items.map((i) => ({ ...i, status: 'ordered' })),
      shipping,
      total: SHIPPING_FEE[shipping.method],
      status: 'placed',
      createdAt: new Date().toISOString(),
    };
    const nextOrders = [order, ...this.orders()];
    this.orders.set(nextOrders);
    save(KEYS.orders, nextOrders);
    this.setItemStatus(itemIds, 'ordered');
    return order;
  }

  shipOrder(orderId: string): void {
    const now = new Date().toISOString();
    const next = this.orders().map((o) =>
      o.id === orderId ? { ...o, status: 'shipped' as const, shippedAt: now } : o
    );
    this.orders.set(next);
    save(KEYS.orders, next);
    const order = next.find((o) => o.id === orderId);
    if (order) {
      this.setItemStatus(
        order.items.map((i) => i.id),
        'shipped'
      );
    }
  }

  // ----- 團（團拆管理） -----
  addGroup(data: Omit<Group, 'id' | 'createdAt'>): void {
    const group: Group = {
      ...data,
      id: newId('GRP'),
      createdAt: new Date().toISOString(),
    };
    const next = [group, ...this.groups()];
    this.groups.set(next);
    save(KEYS.groups, next);
  }

  updateGroup(id: string, patch: Partial<Group>): void {
    const next = this.groups().map((g) => (g.id === id ? { ...g, ...patch } : g));
    this.groups.set(next);
    save(KEYS.groups, next);
  }

  deleteGroup(id: string): void {
    const next = this.groups().filter((g) => g.id !== id);
    this.groups.set(next);
    save(KEYS.groups, next);
  }

  // ----- 消息 -----
  addNews(data: Omit<NewsItem, 'id' | 'createdAt'>): void {
    const item: NewsItem = {
      ...data,
      id: newId('NEWS'),
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...this.news()];
    this.news.set(next);
    save(KEYS.news, next);
  }

  updateNews(id: string, patch: Partial<NewsItem>): void {
    const next = this.news().map((n) => (n.id === id ? { ...n, ...patch } : n));
    this.news.set(next);
    save(KEYS.news, next);
  }

  deleteNews(id: string): void {
    const next = this.news().filter((n) => n.id !== id);
    this.news.set(next);
    save(KEYS.news, next);
  }

  // ----- 種子資料 -----
  private seedIfEmpty(): void {
    if (localStorage.getItem(KEYS.members)) return;

    save(KEYS.seq, 0);
    const adminNo = 'CBZ0000000';
    const admin: Member = {
      id: adminNo,
      account: '0900000000',
      name: '系統管理員',
      password: 'admin',
      credit: 0,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    const demo: Member = {
      id: this.nextMemberNo(),
      account: '0912345678',
      name: '王小明',
      password: '123456',
      credit: 120,
      role: 'member',
      createdAt: new Date().toISOString(),
    };

    save(KEYS.members, [admin, demo]);

    const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const exchangeValues = [30, 50, 80, 100, 60, 40];
    const items: WarehouseItem[] = Array.from({ length: 6 }).map((_, idx) => ({
      id: newId('ITEM'),
      memberId: demo.id,
      cbz: `CBZ${(idx + 1).toString().padStart(2, '0')} 團`,
      groupPhoto: palette[idx % palette.length],
      exchangeValue: exchangeValues[idx],
      status: 'in_warehouse',
      updatedAt: new Date().toISOString(),
    }));
    save(KEYS.items, items);

    const groups: Group[] = Array.from({ length: 6 }).map((_, idx) => ({
      id: newId('GRP'),
      code: `CBZ${(idx + 1).toString().padStart(2, '0')}`,
      name: `CBZ${(idx + 1).toString().padStart(2, '0')} 團`,
      photo: palette[idx % palette.length],
      exchangeValue: exchangeValues[idx],
      createdAt: new Date().toISOString(),
    }));
    save(KEYS.groups, groups);

    save(KEYS.orders, []);

    const news: NewsItem[] = [
      {
        id: newId('NEWS'),
        title: '歡迎使用 CardBeamz 卡牌倉儲服務',
        content: '我們提供卡牌寄倉、回收、換團拆金與代寄服務，立即加入會員體驗！',
        category: 'service',
        createdAt: new Date().toISOString(),
      },
      {
        id: newId('NEWS'),
        title: '系統維護公告',
        content: '本系統將於每週日凌晨 02:00-04:00 進行例行維護，期間部分功能可能暫停。',
        category: 'maintenance',
        createdAt: new Date().toISOString(),
      },
    ];
    save(KEYS.news, news);
  }

  /** 開發用：重置所有資料 */
  reset(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
}
