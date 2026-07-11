export type ItemStatus =
  | 'in_warehouse'
  | 'recycled'
  | 'exchanged'
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
  /** 密碼 */
  password: string;
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

export interface Group {
  id: string;
  /** 團代號，例如 CBZ01 */
  code: string;
  /** 團名稱 */
  name: string;
  /** 分團照（圖片網址，可為 Cloudinary URL 或色碼） */
  photo: string;
  /** 換團拆金金額 */
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

export const SHIPPING_FEE: Record<ShippingMethod, number> = {
  cvs: 60,
  mail: 60,
  pickup: 0,
};
