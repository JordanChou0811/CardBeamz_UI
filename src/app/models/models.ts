export type ItemStatus =
  | 'in_warehouse'
  | 'recycled'
  | 'exchanged'
  | 'gift_pending'
  | 'ordered'
  | 'shipped';

export type Role = 'member' | 'admin';

export interface Member {
  /** 會員編號，例如 CBZ0000001 */
  id: string;
  /** 帳號（手機號碼），09 + 8 碼數字 */
  account: string;
  /** 姓名 */
  name: string;
  /** 密碼（僅本地／註冊用；後端登入後不回傳） */
  password?: string;
  /** 團拆金餘額 */
  credit: number;
  role: Role;
  createdAt: string;
}

export interface WarehouseItem {
  id: string;
  memberId: string;
  /** CBZxx 團 */
  cbz: string;
  /** 卡名（例如角色名、卡別） */
  cardName?: string;
  /** 卡號（例如 001/SP-01） */
  cardNo?: string;
  /** 分團照（圖片網址或代稱） */
  groupPhoto: string;
  /** 換團拆金可得金額 */
  exchangeValue: number;
  status: ItemStatus;
  /** 狀態變更時間 */
  updatedAt: string;
}

export type ShippingMethod = 'cvs' | 'mail' | 'pickup';
export type CvsBrand = '7-11' | '全家' | '萊爾富' | 'OK';

export interface ShippingInfo {
  method: ShippingMethod;
  cvsBrand?: CvsBrand;
  name?: string;
  phone?: string;
  storeName?: string;
  storeAddress?: string;
  address?: string;
  lineId?: string;
  lineName?: string;
}

export type OrderStatus = 'placed' | 'shipped';

export interface Order {
  id: string;
  memberId: string;
  items: WarehouseItem[];
  shipping: ShippingInfo;
  total: number;
  status: OrderStatus;
  createdAt: string;
  shippedAt?: string;
}

/** 玩法：注數認購／籃球買隊／棒球買隊 */
export type GroupType = 'stake_sale' | 'bball_team' | 'baseball_team' | string;

export type TeamSlotStatus = 'available' | 'sold';

export interface TeamSlot {
  id: string;
  groupId: string;
  teamCode: string;
  teamName: string;
  price: number;
  status: TeamSlotStatus;
  buyerMemberId?: string | null;
  paidAmount?: number;
}

export type GroupStatus = 'draft' | 'listed' | 'unlisted';

/** 滿 minQty 注以上，每注 unitPrice 元 */
export interface PriceTier {
  minQty: number;
  unitPrice: number;
}

export interface Group {
  id: string;
  /** 團代號，例如 CBZ01 */
  code: string;
  /** 團名稱 */
  name: string;
  /** 分團照（圖片網址，可為 Cloudinary URL 或色碼） */
  photo: string;
  type?: GroupType;
  status?: GroupStatus;
  totalStakes?: number;
  basePrice?: number;
  soldStakes?: number;
  remainingStakes?: number;
  priceTiers?: PriceTier[];
  /** 買隊團：目前可買球隊的最低售價 */
  minTeamPrice?: number;
  createdAt: string;
}

export interface CartLine {
  cartItemId?: string;
  kind?: 'stake' | 'team';
  groupId: string;
  groupCode: string;
  groupName: string;
  groupPhoto: string;
  groupType?: GroupType;
  quantity: number;
  unitPrice: number;
  basePrice?: number;
  subtotal: number;
  remainingStakes?: number;
  priceTiers?: PriceTier[];
  teamSlotId?: string;
  teamCode?: string;
  teamName?: string;
}

export interface PurchaseOrder {
  id: string;
  kind: 'stake' | 'team';
  groupCode: string;
  groupName: string;
  groupPhoto: string;
  quantity?: number;
  unitPrice?: number;
  teamCode?: string;
  teamName?: string;
  subtotal: number;
  creditUsed: number;
  cashDue: number;
  status: string;
  createdAt: string;
}

/** 團的卡片目錄（尚未分派給會員） */
export interface GroupCard {
  id: string;
  groupId: string;
  cardName?: string;
  cardNo?: string;
  photo: string;
  exchangeValue: number;
  createdAt: string;
}

export type NewsCategory = 'service' | 'maintenance';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  createdAt: string;
}

export type GiftType = 'card' | 'credit';
export type GiftStatus = 'pending' | 'accepted' | 'rejected';

export interface GiftTransaction {
  id: string;
  type: GiftType;
  senderMemberId: string;
  recipientMemberId: string;
  warehouseItemId?: string;
  creditAmount?: number;
  status: GiftStatus;
  createdAt: string;
  completedAt?: string;
}

export const SHIPPING_FEE: Record<ShippingMethod, number> = {
  cvs: 60,
  mail: 60,
  pickup: 0,
};
