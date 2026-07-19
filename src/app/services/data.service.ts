import { Injectable, Injector, signal } from '@angular/core';
import {
  CartLine,
  Group,
  GroupCard,
  Member,
  NewsItem,
  Order,
  PriceTier,
  ShippingInfo,
  SHIPPING_FEE,
  TeamSlot,
  WarehouseItem,
} from '../models/models';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { TelegramService } from './telegram.service';

const KEYS = {
  members: 'cbz_members',
  items: 'cbz_items',
  orders: 'cbz_orders',
  news: 'cbz_news',
  groups: 'cbz_groups',
  groupCards: 'cbz_group_cards',
  cart: 'cbz_cart',
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
  /** 目前載入的團卡片目錄（依 refreshGroupCards 的 groupId） */
  readonly groupCards = signal<GroupCard[]>([]);
  readonly listedGroups = signal<Group[]>([]);
  readonly teamSlots = signal<TeamSlot[]>([]);
  readonly cartLines = signal<CartLine[]>([]);
  readonly cartGrandSubtotal = signal(0);
  readonly cartMaxCredit = signal(0);
  readonly ready = signal(false);
  readonly loadError = signal('');

  constructor(
    private api: TelegramService,
    private injector: Injector
  ) {
    if (environment.useApi) {
      void this.refreshAll();
    } else {
      this.seedIfEmpty();
      this.members.set(load(KEYS.members, []));
      this.items.set(load(KEYS.items, []));
      this.orders.set(load(KEYS.orders, []));
      this.news.set(load(KEYS.news, []));
      this.groups.set(load(KEYS.groups, []));
      this.groupCards.set([]);
      this.ready.set(true);
    }
  }

  private auth(): AuthService {
    return this.injector.get(AuthService);
  }

  // ========== API mode ==========
  async refreshAll(): Promise<void> {
    this.loadError.set('');
    try {
      await Promise.all([
        this.refreshMembers(),
        this.refreshItems(),
        this.refreshOrders(),
        this.refreshNews(),
        this.refreshGroups(),
      ]);
      this.ready.set(true);
    } catch (e) {
      this.loadError.set(e instanceof Error ? e.message : '載入失敗');
      this.ready.set(true);
    }
  }

  async refreshMembers(): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.get<{ members: Member[] }>('member', 'list');
    this.members.set(res.data.members ?? []);
  }

  async refreshItems(memberId?: string, status?: string): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.get<{ items: WarehouseItem[] }>('warehouse', 'list', {
      memberId,
      status,
    });
    if (!memberId && !status) {
      this.items.set(res.data.items ?? []);
      return;
    }
    const incoming = res.data.items ?? [];
    const others = this.items().filter((i) => {
      if (memberId && status) return !(i.memberId === memberId && i.status === status);
      if (memberId) return i.memberId !== memberId;
      return i.status !== status;
    });
    this.items.set([...incoming, ...others]);
  }

  async refreshOrders(memberId?: string): Promise<void> {
    if (!environment.useApi) return;
    const [placed, shipped] = await Promise.all([
      this.api.get<{ orders: Order[] }>('order', 'list-placed', { memberId }),
      this.api.get<{ orders: Order[] }>('order', 'list-shipped', { memberId }),
    ]);
    const all = [...(placed.data.orders ?? []), ...(shipped.data.orders ?? [])];
    if (!memberId) {
      this.orders.set(all);
      return;
    }
    const others = this.orders().filter((o) => o.memberId !== memberId);
    this.orders.set([...all, ...others]);
  }

  async refreshNews(): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.get<{ news: NewsItem[] }>('news', 'list');
    this.news.set(res.data.news ?? []);
  }

  async refreshGroups(): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.get<{ groups: Group[] }>('group', 'list');
    this.groups.set(res.data.groups ?? []);
  }

  // ========== 共用查詢 ==========
  findByAccount(account: string): Member | undefined {
    return this.members().find((m) => m.account === account);
  }

  findMember(id: string): Member | undefined {
    return this.members().find((m) => m.id === id);
  }

  itemsOf(memberId: string): WarehouseItem[] {
    return this.items().filter((i) => i.memberId === memberId);
  }

  warehouseItems(memberId: string): WarehouseItem[] {
    return this.itemsOf(memberId).filter((i) => i.status === 'in_warehouse');
  }

  ordersOf(memberId: string): Order[] {
    return this.orders().filter((o) => o.memberId === memberId);
  }

  // ========== 會員 ==========
  async createMember(data: {
    account: string;
    name: string;
    password: string;
    verifyCode: string;
  }): Promise<Member> {
    if (!environment.useApi) {
      if (this.findByAccount(data.account)) throw new Error('帳號已存在');
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
    const res = await this.api.post<{ member: Member }>('member', 'register', data);
    await this.refreshMembers();
    return res.data.member;
  }

  async sendVerifyCode(account: string): Promise<string> {
    if (!environment.useApi) {
      return String(100000 + Math.floor(Math.random() * 900000));
    }
    const res = await this.api.post<{ debugCode?: string }>('member', 'send-verify-code', {
      account,
    });
    return res.data.debugCode ?? '';
  }

  async changePassword(memberId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (!environment.useApi) {
      const m = this.findMember(memberId);
      if (!m || m.password !== oldPassword) throw new Error('舊密碼錯誤');
      this.patchMemberLocal(memberId, { password: newPassword });
      return;
    }
    await this.api.post('member', 'change-password', { memberId, oldPassword, newPassword });
  }

  async updateMemberCredit(id: string, credit: number): Promise<void> {
    if (!environment.useApi) {
      this.patchMemberLocal(id, { credit });
      this.auth().patchCurrentUser({ credit });
      return;
    }
    await this.api.post('credit', 'update', { memberId: id, credit });
    await this.refreshMembers();
    if (this.auth().currentUser()?.id === id) await this.auth().refreshMe(id);
  }

  async adminCreateMember(data: {
    account: string;
    name: string;
    password: string;
    credit?: number;
  }): Promise<Member> {
    if (!environment.useApi) {
      if (this.findByAccount(data.account)) throw new Error('帳號已存在');
      const member: Member = {
        id: this.nextMemberNo(),
        account: data.account,
        name: data.name,
        password: data.password,
        credit: Math.max(0, data.credit ?? 0),
        role: 'member',
        createdAt: new Date().toISOString(),
      };
      const next = [...this.members(), member];
      this.members.set(next);
      save(KEYS.members, next);
      return member;
    }
    const res = await this.api.post<{ member: Member }>('member', 'create', data);
    await this.refreshMembers();
    return res.data.member;
  }

  async adminUpdateMember(
    id: string,
    patch: { name?: string; account?: string; password?: string; credit?: number }
  ): Promise<void> {
    if (!environment.useApi) {
      const cur = this.findMember(id);
      if (!cur) throw new Error('會員不存在');
      if (patch.account && patch.account !== cur.account && this.findByAccount(patch.account)) {
        throw new Error('帳號已存在');
      }
      this.patchMemberLocal(id, {
        ...patch,
        password: patch.password?.trim() ? patch.password : cur.password,
      });
      if (this.auth().currentUser()?.id === id) {
        this.auth().patchCurrentUser({
          name: patch.name ?? cur.name,
          account: patch.account ?? cur.account,
          credit: patch.credit ?? cur.credit,
        });
      }
      return;
    }
    await this.api.post('member', 'update', { id, ...patch });
    await this.refreshMembers();
    if (this.auth().currentUser()?.id === id) await this.auth().refreshMe(id);
  }

  // ========== 倉庫 ==========
  async assignItems(
    memberId: string,
    card: {
      name: string;
      photo: string;
      exchangeValue: number;
      cardName?: string;
      cardNo?: string;
    },
    quantity = 1
  ): Promise<WarehouseItem[]> {
    if (!environment.useApi) {
      const now = new Date().toISOString();
      const created: WarehouseItem[] = [];
      const count = Math.max(1, Math.floor(quantity) || 1);
      for (let i = 0; i < count; i++) {
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
    const res = await this.api.post<WarehouseItem[]>('warehouse', 'assign', {
      memberId,
      cbz: card.name,
      groupPhoto: card.photo,
      exchangeValue: card.exchangeValue,
      cardName: card.cardName,
      cardNo: card.cardNo,
      quantity,
    });
    await this.refreshItems();
    return res.data ?? [];
  }

  async removeItem(itemId: string): Promise<void> {
    if (!environment.useApi) {
      const next = this.items().filter((i) => i.id !== itemId);
      this.items.set(next);
      save(KEYS.items, next);
      return;
    }
    await this.api.post('warehouse', 'remove', { itemId });
    this.items.update((list) => list.filter((i) => i.id !== itemId));
  }

  async recycle(itemId: string): Promise<void> {
    if (!environment.useApi) {
      this.setItemStatusLocal([itemId], 'recycled');
      return;
    }
    await this.api.post('warehouse', 'recycle', { itemId });
    await this.refreshItems();
  }

  async exchange(itemId: string): Promise<void> {
    if (!environment.useApi) {
      const item = this.items().find((i) => i.id === itemId);
      if (!item) return;
      this.setItemStatusLocal([itemId], 'exchanged');
      const m = this.findMember(item.memberId);
      if (m) {
        const credit = m.credit + item.exchangeValue;
        this.patchMemberLocal(item.memberId, { credit });
        this.auth().patchCurrentUser({ credit });
      }
      return;
    }
    await this.api.post('warehouse', 'exchange', { itemId });
    await this.refreshItems();
    await this.auth().refreshMe();
    await this.refreshMembers();
  }

  async checkout(memberId: string, itemIds: string[], shipping: ShippingInfo): Promise<Order> {
    if (!environment.useApi) {
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
      this.setItemStatusLocal(itemIds, 'ordered');
      return order;
    }
    const res = await this.api.post<{
      orderId: string;
      shippingFee: number;
      status: string;
      createdAt: string;
    }>('warehouse', 'checkout', {
      memberId,
      itemIds,
      shipping: { ...shipping },
    });
    await this.refreshItems();
    await this.refreshOrders();
    return (
      this.orders().find((o) => o.id === res.data.orderId) ?? {
        id: res.data.orderId,
        memberId,
        items: this.items().filter((i) => itemIds.includes(i.id)),
        shipping,
        total: res.data.shippingFee,
        status: 'placed',
        createdAt: res.data.createdAt,
      }
    );
  }

  // ========== 訂單 ==========
  async shipOrder(orderId: string): Promise<void> {
    if (!environment.useApi) {
      const now = new Date().toISOString();
      const next = this.orders().map((o) =>
        o.id === orderId ? { ...o, status: 'shipped' as const, shippedAt: now } : o
      );
      this.orders.set(next);
      save(KEYS.orders, next);
      const order = next.find((o) => o.id === orderId);
      if (order) this.setItemStatusLocal(order.items.map((i) => i.id), 'shipped');
      return;
    }
    await this.api.post('order', 'ship', { orderId });
    await this.refreshOrders();
    await this.refreshItems();
  }

  // ========== 團 ==========
  async addGroup(data: Omit<Group, 'id' | 'createdAt'>): Promise<void> {
    if (!environment.useApi) {
      const group: Group = { ...data, id: newId('GRP'), createdAt: new Date().toISOString() };
      const next = [group, ...this.groups()];
      this.groups.set(next);
      save(KEYS.groups, next);
      return;
    }
    await this.api.post('group', 'create', data);
    await this.refreshGroups();
  }

  async updateGroup(id: string, patch: Partial<Group>): Promise<void> {
    if (!environment.useApi) {
      const next = this.groups().map((g) => (g.id === id ? { ...g, ...patch } : g));
      this.groups.set(next);
      save(KEYS.groups, next);
      return;
    }
    await this.api.post('group', 'update', { id, ...patch });
    await this.refreshGroups();
  }

  async deleteGroup(id: string): Promise<void> {
    if (!environment.useApi) {
      const next = this.groups().filter((g) => g.id !== id);
      this.groups.set(next);
      save(KEYS.groups, next);
      const cards = load<GroupCard[]>(KEYS.groupCards, []).filter((c) => c.groupId !== id);
      save(KEYS.groupCards, cards);
      if (this.groupCards().some((c) => c.groupId === id)) {
        this.groupCards.set(this.groupCards().filter((c) => c.groupId !== id));
      }
      return;
    }
    await this.api.post('group', 'delete', { id });
    await this.refreshGroups();
  }

  async updateGroupSale(
    id: string,
    sale: {
      type?: string;
      totalStakes?: number;
      basePrice?: number;
      priceTiers?: PriceTier[];
    }
  ): Promise<void> {
    if (!environment.useApi) {
      const next = this.groups().map((g) => {
        if (g.id !== id) return g;
        if (g.status === 'listed') {
          // mock：上架中僅允許改價欄位（不模擬退款）
          const basePrice = sale.basePrice ?? g.basePrice ?? 0;
          if (basePrice > (g.basePrice ?? 0)) throw new Error('price increase');
          return {
            ...g,
            basePrice,
            priceTiers: sale.priceTiers ?? g.priceTiers,
          };
        }
        const totalStakes = sale.totalStakes ?? g.totalStakes ?? 0;
        const sold = g.soldStakes ?? 0;
        return {
          ...g,
          ...sale,
          remainingStakes: Math.max(0, totalStakes - sold),
        };
      });
      this.groups.set(next);
      save(KEYS.groups, next);
      return;
    }
    await this.api.post('group', 'update-sale', { id, ...sale });
    await this.refreshGroups();
  }

  async publishGroup(id: string): Promise<void> {
    if (!environment.useApi) {
      const cards = load<GroupCard[]>(KEYS.groupCards, []).filter((c) => c.groupId === id);
      const next = this.groups().map((g) => {
        if (g.id !== id) return g;
        const team = g.type === 'bball_team' || g.type === 'baseball_team';
        if (team) {
          // mock：買隊團不必有卡片
        } else if (cards.length < 1 || (g.totalStakes ?? 0) < 1 || (g.basePrice ?? 0) < 1) {
          throw new Error('cannot list');
        }
        return { ...g, status: 'listed' as const, soldStakes: 0, remainingStakes: g.totalStakes ?? 0 };
      });
      this.groups.set(next);
      save(KEYS.groups, next);
      return;
    }
    await this.api.post('group', 'publish', { id });
    await this.refreshGroups();
  }

  async unlistGroup(id: string): Promise<void> {
    if (!environment.useApi) {
      const next = this.groups().map((g) =>
        g.id === id
          ? { ...g, status: 'unlisted' as const, soldStakes: 0, remainingStakes: g.totalStakes ?? 0 }
          : g
      );
      this.groups.set(next);
      save(KEYS.groups, next);
      return;
    }
    await this.api.post('group', 'unlist', { id });
    await this.refreshGroups();
  }

  async refreshListedGroups(): Promise<void> {
    if (!environment.useApi) {
      this.listedGroups.set(this.groups().filter((g) => g.status === 'listed'));
      return;
    }
    const res = await this.api.get<{ groups: Group[] }>('group', 'list-listed');
    this.listedGroups.set(res.data.groups ?? []);
  }

  // ========== 購物車 ==========
  async refreshCart(memberId: string): Promise<void> {
    if (!memberId) {
      this.cartLines.set([]);
      this.cartGrandSubtotal.set(0);
      this.cartMaxCredit.set(0);
      return;
    }
    if (!environment.useApi) {
      this.cartLines.set([]);
      this.cartGrandSubtotal.set(0);
      this.cartMaxCredit.set(0);
      return;
    }
    const res = await this.api.get<{
      items: CartLine[];
      grandSubtotal: number;
      maxCreditUsable: number;
    }>('cart', 'list', { memberId });
    this.cartLines.set(res.data.items ?? []);
    this.cartGrandSubtotal.set(res.data.grandSubtotal ?? 0);
    this.cartMaxCredit.set(res.data.maxCreditUsable ?? 0);
  }

  async upsertCart(memberId: string, groupId: string, quantity: number): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.post<{
      items: CartLine[];
      grandSubtotal: number;
      maxCreditUsable: number;
    }>('cart', 'upsert', { memberId, groupId, quantity });
    this.cartLines.set(res.data.items ?? []);
    this.cartGrandSubtotal.set(res.data.grandSubtotal ?? 0);
    this.cartMaxCredit.set(res.data.maxCreditUsable ?? 0);
  }

  async upsertCartTeam(memberId: string, teamSlotId: string, add = true): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.post<{
      items: CartLine[];
      grandSubtotal: number;
      maxCreditUsable: number;
    }>('cart', 'upsert-team', { memberId, teamSlotId, add });
    this.cartLines.set(res.data.items ?? []);
    this.cartGrandSubtotal.set(res.data.grandSubtotal ?? 0);
    this.cartMaxCredit.set(res.data.maxCreditUsable ?? 0);
  }

  async removeCartItem(memberId: string, groupId: string): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.post<{
      items: CartLine[];
      grandSubtotal: number;
      maxCreditUsable: number;
    }>('cart', 'remove', { memberId, groupId });
    this.cartLines.set(res.data.items ?? []);
    this.cartGrandSubtotal.set(res.data.grandSubtotal ?? 0);
    this.cartMaxCredit.set(res.data.maxCreditUsable ?? 0);
  }

  async removeCartTeam(memberId: string, teamSlotId: string): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.post<{
      items: CartLine[];
      grandSubtotal: number;
      maxCreditUsable: number;
    }>('cart', 'remove', { memberId, teamSlotId });
    this.cartLines.set(res.data.items ?? []);
    this.cartGrandSubtotal.set(res.data.grandSubtotal ?? 0);
    this.cartMaxCredit.set(res.data.maxCreditUsable ?? 0);
  }

  // ========== 買隊槽位 ==========
  async refreshTeamSlots(groupId: string): Promise<void> {
    if (!groupId) {
      this.teamSlots.set([]);
      return;
    }
    if (!environment.useApi) {
      this.teamSlots.set([]);
      return;
    }
    const res = await this.api.get<{ slots: TeamSlot[] }>('group-team', 'list', { groupId });
    this.teamSlots.set(res.data.slots ?? []);
  }

  async updateTeamPrices(
    groupId: string,
    prices: { teamCode: string; price: number }[]
  ): Promise<void> {
    if (!environment.useApi) return;
    const res = await this.api.post<{ slots: TeamSlot[] }>('group-team', 'update-prices', {
      groupId,
      prices,
    });
    this.teamSlots.set(res.data.slots ?? []);
    await this.refreshGroups();
  }

  async checkoutCart(
    memberId: string,
    creditToUse: number
  ): Promise<{ grandSubtotal: number; creditUsed: number; cashDue: number }> {
    const res = await this.api.post<{
      grandSubtotal: number;
      creditUsed: number;
      cashDue: number;
    }>('cart', 'checkout', { memberId, creditToUse });
    this.cartLines.set([]);
    this.cartGrandSubtotal.set(0);
    this.cartMaxCredit.set(0);
    await this.auth().refreshMe(memberId);
    await this.refreshListedGroups();
    return res.data;
  }

  // ========== 團卡片目錄 ==========
  async refreshGroupCards(groupId: string): Promise<void> {
    if (!groupId) {
      this.groupCards.set([]);
      return;
    }
    if (!environment.useApi) {
      const all = load<GroupCard[]>(KEYS.groupCards, []);
      this.groupCards.set(all.filter((c) => c.groupId === groupId));
      return;
    }
    const res = await this.api.get<{ cards: GroupCard[] }>('group-card', 'list', { groupId });
    this.groupCards.set(res.data.cards ?? []);
  }

  async addGroupCard(
    groupId: string,
    data: { cardName?: string; cardNo?: string; photo?: string; exchangeValue?: number }
  ): Promise<void> {
    if (!environment.useApi) {
      const group = this.groups().find((g) => g.id === groupId);
      const card: GroupCard = {
        id: newId('GCARD'),
        groupId,
        cardName: data.cardName?.trim() || undefined,
        cardNo: data.cardNo?.trim() || undefined,
        photo: data.photo?.trim() || group?.photo || '#6366f1',
        exchangeValue: data.exchangeValue ?? 0,
        createdAt: new Date().toISOString(),
      };
      const all = [card, ...load<GroupCard[]>(KEYS.groupCards, [])];
      save(KEYS.groupCards, all);
      this.groupCards.set(all.filter((c) => c.groupId === groupId));
      return;
    }
    await this.api.post('group-card', 'create', { groupId, ...data });
    await this.refreshGroupCards(groupId);
  }

  async updateGroupCard(
    id: string,
    groupId: string,
    patch: { cardName?: string; cardNo?: string; photo?: string; exchangeValue?: number }
  ): Promise<void> {
    if (!environment.useApi) {
      const all = load<GroupCard[]>(KEYS.groupCards, []).map((c) =>
        c.id === id
          ? {
              ...c,
              ...patch,
              cardName: patch.cardName !== undefined ? patch.cardName.trim() || undefined : c.cardName,
              cardNo: patch.cardNo !== undefined ? patch.cardNo.trim() || undefined : c.cardNo,
            }
          : c
      );
      save(KEYS.groupCards, all);
      this.groupCards.set(all.filter((c) => c.groupId === groupId));
      return;
    }
    await this.api.post('group-card', 'update', { id, ...patch });
    await this.refreshGroupCards(groupId);
  }

  async deleteGroupCard(id: string, groupId: string): Promise<void> {
    if (!environment.useApi) {
      const all = load<GroupCard[]>(KEYS.groupCards, []).filter((c) => c.id !== id);
      save(KEYS.groupCards, all);
      this.groupCards.set(all.filter((c) => c.groupId === groupId));
      return;
    }
    await this.api.post('group-card', 'delete', { id });
    await this.refreshGroupCards(groupId);
  }

  async assignFromCatalog(
    memberId: string,
    groupCardId: string,
    quantity = 1
  ): Promise<WarehouseItem[]> {
    if (!environment.useApi) {
      const card = load<GroupCard[]>(KEYS.groupCards, []).find((c) => c.id === groupCardId);
      const group = card ? this.groups().find((g) => g.id === card.groupId) : undefined;
      if (!card || !group) return [];
      return this.assignItems(
        memberId,
        {
          name: group.code,
          photo: card.photo,
          exchangeValue: card.exchangeValue,
          cardName: card.cardName,
          cardNo: card.cardNo,
        },
        quantity
      );
    }
    const res = await this.api.post<WarehouseItem[]>('warehouse', 'assign', {
      memberId,
      groupCardId,
      quantity: Math.max(1, Math.floor(quantity) || 1),
    });
    await this.refreshItems(undefined, 'in_warehouse');
    return res.data ?? [];
  }

  // ========== 消息 ==========
  async addNews(data: Omit<NewsItem, 'id' | 'createdAt'>): Promise<void> {
    if (!environment.useApi) {
      const item: NewsItem = { ...data, id: newId('NEWS'), createdAt: new Date().toISOString() };
      const next = [item, ...this.news()];
      this.news.set(next);
      save(KEYS.news, next);
      return;
    }
    await this.api.post('news', 'save', data);
    await this.refreshNews();
  }

  async updateNews(id: string, patch: Partial<NewsItem>): Promise<void> {
    if (!environment.useApi) {
      const next = this.news().map((n) => (n.id === id ? { ...n, ...patch } : n));
      this.news.set(next);
      save(KEYS.news, next);
      return;
    }
    const cur = this.news().find((n) => n.id === id);
    await this.api.post('news', 'save', {
      id,
      title: patch.title ?? cur?.title,
      content: patch.content ?? cur?.content,
      category: patch.category ?? cur?.category,
    });
    await this.refreshNews();
  }

  async deleteNews(id: string): Promise<void> {
    if (!environment.useApi) {
      const next = this.news().filter((n) => n.id !== id);
      this.news.set(next);
      save(KEYS.news, next);
      return;
    }
    await this.api.post('news', 'delete', { id });
    await this.refreshNews();
  }

  async sendNotify(payload: {
    memberId: string;
    channels: string[];
    subject: string;
    body: string;
  }): Promise<void> {
    if (!environment.useApi) return; // 模擬模式只記前端 log
    await this.api.post('notify', 'send', payload);
  }

  // ========== local helpers ==========
  private nextMemberNo(): string {
    const seq = load<number>(KEYS.seq, 0) + 1;
    save(KEYS.seq, seq);
    return 'CBZ' + seq.toString().padStart(7, '0');
  }

  private patchMemberLocal(id: string, patch: Partial<Member>): void {
    const next = this.members().map((m) => (m.id === id ? { ...m, ...patch } : m));
    this.members.set(next);
    save(KEYS.members, next);
  }

  private setItemStatusLocal(ids: string[], status: WarehouseItem['status']): void {
    const now = new Date().toISOString();
    const next = this.items().map((i) =>
      ids.includes(i.id) ? { ...i, status, updatedAt: now } : i
    );
    this.items.set(next);
    save(KEYS.items, next);
  }

  private seedIfEmpty(): void {
    if (localStorage.getItem(KEYS.members)) return;

    save(KEYS.seq, 0);
    const admin: Member = {
      id: 'CBZ0000000',
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
      status: 'in_warehouse' as const,
      updatedAt: new Date().toISOString(),
    }));
    save(KEYS.items, items);

    const groups: Group[] = Array.from({ length: 6 }).map((_, idx) => ({
      id: newId('GRP'),
      code: `CBZ${(idx + 1).toString().padStart(2, '0')}`,
      name: `CBZ${(idx + 1).toString().padStart(2, '0')} 團`,
      photo: palette[idx % palette.length],
      type: 'stake_sale',
      status: 'draft',
      totalStakes: 0,
      basePrice: 0,
      soldStakes: 0,
      remainingStakes: 0,
      priceTiers: [],
      createdAt: new Date().toISOString(),
    }));
    save(KEYS.groups, groups);
    save(KEYS.orders, []);
    save(KEYS.news, [
      {
        id: newId('NEWS'),
        title: '歡迎使用 CardBeamz 卡牌倉儲服務',
        content: '我們提供卡牌寄倉、回收、換團拆金與代寄服務，立即加入會員體驗！',
        category: 'service' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: newId('NEWS'),
        title: '系統維護公告',
        content: '本系統將於每週日凌晨 02:00-04:00 進行例行維護，期間部分功能可能暫停。',
        category: 'maintenance' as const,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}
