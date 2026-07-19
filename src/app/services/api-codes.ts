/**
 * API returnCode 對照表（與後端 ReturnCodes.java 同步）。
 *
 * 規則：
 * - 0000 = 成功
 * - 1xxx = member 會員
 * - 2xxx = warehouse 倉庫
 * - 3xxx = order 訂單
 * - 4xxx = group 團
 * - 5xxx = news 消息
 * - 9xxx = 系統／連線／參數
 *
 * 前端應依 returnCode 對應 i18n key，不要解析 returnMsg 中文。
 */
export const ReturnCodes = {
  /** 成功 */
  OK: '0000',

  // ----- member 1xxx -----
  /** 帳號或密碼錯誤（登入） */
  MEMBER_LOGIN_FAILED: '1001',
  /** 驗證碼錯誤或已過期 */
  MEMBER_VERIFY_INVALID: '1002',
  /** 帳號（手機）已存在 */
  MEMBER_ACCOUNT_EXISTS: '1003',
  /** 會員不存在 */
  MEMBER_NOT_FOUND: '1004',
  /** 舊密碼錯誤 */
  MEMBER_OLD_PASSWORD_WRONG: '1005',
  /** 帳號格式錯誤（須 09 + 8 碼） */
  MEMBER_ACCOUNT_FORMAT: '1006',
  /** 不可由此修改管理員 */
  MEMBER_ADMIN_FORBIDDEN: '1007',

  // ----- warehouse 2xxx -----
  /** 未選擇卡片 */
  WAREHOUSE_NO_ITEMS: '2001',
  /** 部分卡片不存在 */
  WAREHOUSE_ITEM_MISSING: '2002',
  /** 卡片狀態不可結帳 */
  WAREHOUSE_ITEM_NOT_READY: '2003',
  /** 卡片不存在 */
  WAREHOUSE_ITEM_NOT_FOUND: '2004',
  /** 卡片不在倉庫中 */
  WAREHOUSE_ITEM_NOT_IN_STOCK: '2005',

  // ----- order 3xxx -----
  /** 訂單不存在 */
  ORDER_NOT_FOUND: '3001',
  /** 訂單狀態不可出貨 */
  ORDER_CANNOT_SHIP: '3002',

  // ----- group 4xxx -----
  /** 團代號已存在 */
  GROUP_CODE_EXISTS: '4001',
  /** 團不存在 */
  GROUP_NOT_FOUND: '4002',
  /** 團卡片目錄項目不存在 */
  GROUP_CARD_NOT_FOUND: '4101',
  /** 上架中不可改總注數／玩法 */
  GROUP_LISTED_LOCKED: '4201',
  /** 上架條件不符 */
  GROUP_CANNOT_LIST: '4202',
  /** 團未上架 */
  GROUP_NOT_LISTED: '4203',
  /** 剩餘注數不足 */
  GROUP_STAKES_INSUFFICIENT: '4204',
  /** 購物車是空的 */
  CART_EMPTY: '4205',
  /** 團拆金折抵不合法 */
  CART_CREDIT_INVALID: '4206',
  /** 上架中只准降價 */
  GROUP_PRICE_INCREASE_FORBIDDEN: '4207',

  // ----- news 5xxx -----
  /** 消息不存在 */
  NEWS_NOT_FOUND: '5001',

  // ----- system 9xxx -----
  /** 參數驗證失敗 */
  SYSTEM_VALIDATION: '9001',
  /** 尚未設定 Cloudinary API Key／Secret */
  CLOUDINARY_NOT_CONFIGURED: '9101',
  /** Cloudinary 列出圖片失敗 */
  CLOUDINARY_LIST_FAILED: '9102',
  /** 回應格式錯誤 */
  SYSTEM_BAD_RESPONSE: '9997',
  /** 無法連線後端 */
  SYSTEM_OFFLINE: '9998',
  /** 未分類系統錯誤 */
  SYSTEM_ERROR: '9999',
} as const;

export type ReturnCode = (typeof ReturnCodes)[keyof typeof ReturnCodes];

/** returnCode → i18n key（顯示給使用者的錯誤訊息） */
export const RETURN_CODE_I18N: Record<string, string> = {
  // member
  [ReturnCodes.MEMBER_LOGIN_FAILED]: 'api.err.1001',
  [ReturnCodes.MEMBER_VERIFY_INVALID]: 'api.err.1002',
  [ReturnCodes.MEMBER_ACCOUNT_EXISTS]: 'api.err.1003',
  [ReturnCodes.MEMBER_NOT_FOUND]: 'api.err.1004',
  [ReturnCodes.MEMBER_OLD_PASSWORD_WRONG]: 'api.err.1005',
  [ReturnCodes.MEMBER_ACCOUNT_FORMAT]: 'api.err.1006',
  [ReturnCodes.MEMBER_ADMIN_FORBIDDEN]: 'api.err.1007',
  // warehouse
  [ReturnCodes.WAREHOUSE_NO_ITEMS]: 'api.err.2001',
  [ReturnCodes.WAREHOUSE_ITEM_MISSING]: 'api.err.2002',
  [ReturnCodes.WAREHOUSE_ITEM_NOT_READY]: 'api.err.2003',
  [ReturnCodes.WAREHOUSE_ITEM_NOT_FOUND]: 'api.err.2004',
  [ReturnCodes.WAREHOUSE_ITEM_NOT_IN_STOCK]: 'api.err.2005',
  // order
  [ReturnCodes.ORDER_NOT_FOUND]: 'api.err.3001',
  [ReturnCodes.ORDER_CANNOT_SHIP]: 'api.err.3002',
  // group
  [ReturnCodes.GROUP_CODE_EXISTS]: 'api.err.4001',
  [ReturnCodes.GROUP_NOT_FOUND]: 'api.err.4002',
  [ReturnCodes.GROUP_CARD_NOT_FOUND]: 'api.err.4101',
  [ReturnCodes.GROUP_LISTED_LOCKED]: 'api.err.4201',
  [ReturnCodes.GROUP_CANNOT_LIST]: 'api.err.4202',
  [ReturnCodes.GROUP_NOT_LISTED]: 'api.err.4203',
  [ReturnCodes.GROUP_STAKES_INSUFFICIENT]: 'api.err.4204',
  [ReturnCodes.CART_EMPTY]: 'api.err.4205',
  [ReturnCodes.CART_CREDIT_INVALID]: 'api.err.4206',
  [ReturnCodes.GROUP_PRICE_INCREASE_FORBIDDEN]: 'api.err.4207',
  // news
  [ReturnCodes.NEWS_NOT_FOUND]: 'api.err.5001',
  // system
  [ReturnCodes.SYSTEM_VALIDATION]: 'api.err.9001',
  [ReturnCodes.CLOUDINARY_NOT_CONFIGURED]: 'api.err.9101',
  [ReturnCodes.CLOUDINARY_LIST_FAILED]: 'api.err.9102',
  [ReturnCodes.SYSTEM_BAD_RESPONSE]: 'api.err.9997',
  [ReturnCodes.SYSTEM_OFFLINE]: 'api.err.9998',
  [ReturnCodes.SYSTEM_ERROR]: 'api.err.9999',
};

/** 依 returnCode 取得 i18n key；未知碼回傳 fallback */
export function i18nKeyForReturnCode(code: string, fallback = 'api.err.unknown'): string {
  return RETURN_CODE_I18N[code] ?? fallback;
}
