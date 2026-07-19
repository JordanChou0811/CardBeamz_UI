package com.cardbeamz.common;

/**
 * API 回應碼（returnCode）定義。
 *
 * <p>規則：
 * <ul>
 *   <li>{@code 0000} = 成功</li>
 *   <li>{@code 1xxx} = 會員 member</li>
 *   <li>{@code 2xxx} = 倉庫 warehouse</li>
 *   <li>{@code 3xxx} = 訂單 order</li>
 *   <li>{@code 4xxx} = 團 group</li>
 *   <li>{@code 5xxx} = 消息 news</li>
 *   <li>{@code 9xxx} = 系統／連線／參數</li>
 * </ul>
 *
 * <p>前端請依 returnCode 對應 i18n，勿依賴 returnMsg 語系文字。
 */
public final class ReturnCodes {

  private ReturnCodes() {}

  /** 成功 */
  public static final String OK = "0000";

  // ----- member 1xxx -----
  /** 帳號或密碼錯誤（登入） */
  public static final String MEMBER_LOGIN_FAILED = "1001";
  /** 驗證碼錯誤或已過期 */
  public static final String MEMBER_VERIFY_INVALID = "1002";
  /** 帳號（手機）已存在 */
  public static final String MEMBER_ACCOUNT_EXISTS = "1003";
  /** 會員不存在 */
  public static final String MEMBER_NOT_FOUND = "1004";
  /** 舊密碼錯誤 */
  public static final String MEMBER_OLD_PASSWORD_WRONG = "1005";
  /** 帳號格式錯誤（須 09 + 8 碼） */
  public static final String MEMBER_ACCOUNT_FORMAT = "1006";
  /** 不可由此修改管理員 */
  public static final String MEMBER_ADMIN_FORBIDDEN = "1007";

  // ----- warehouse 2xxx -----
  /** 未選擇卡片 */
  public static final String WAREHOUSE_NO_ITEMS = "2001";
  /** 部分卡片不存在 */
  public static final String WAREHOUSE_ITEM_MISSING = "2002";
  /** 卡片狀態不可結帳 */
  public static final String WAREHOUSE_ITEM_NOT_READY = "2003";
  /** 卡片不存在 */
  public static final String WAREHOUSE_ITEM_NOT_FOUND = "2004";
  /** 卡片不在倉庫中 */
  public static final String WAREHOUSE_ITEM_NOT_IN_STOCK = "2005";

  // ----- order 3xxx -----
  /** 訂單不存在 */
  public static final String ORDER_NOT_FOUND = "3001";
  /** 訂單狀態不可出貨 */
  public static final String ORDER_CANNOT_SHIP = "3002";

  // ----- group 4xxx -----
  /** 團代號已存在 */
  public static final String GROUP_CODE_EXISTS = "4001";
  /** 團不存在 */
  public static final String GROUP_NOT_FOUND = "4002";
  /** 團卡片目錄項目不存在 */
  public static final String GROUP_CARD_NOT_FOUND = "4101";
  /** 上架中不可修改銷售設定（請先下架） */
  public static final String GROUP_LISTED_LOCKED = "4201";
  /** 上架條件不符（需有卡片、注數與價格） */
  public static final String GROUP_CANNOT_LIST = "4202";
  /** 團未上架或不可購買 */
  public static final String GROUP_NOT_LISTED = "4203";
  /** 剩餘注數不足 */
  public static final String GROUP_STAKES_INSUFFICIENT = "4204";
  /** 購物車是空的 */
  public static final String CART_EMPTY = "4205";
  /** 團拆金折抵不合法（須整數且現金至少留 1 元） */
  public static final String CART_CREDIT_INVALID = "4206";

  // ----- news 5xxx -----
  /** 消息不存在 */
  public static final String NEWS_NOT_FOUND = "5001";

  // ----- system 9xxx -----
  /** 參數驗證失敗 */
  public static final String SYSTEM_VALIDATION = "9001";
  /** 尚未設定 Cloudinary API Key／Secret */
  public static final String CLOUDINARY_NOT_CONFIGURED = "9101";
  /** Cloudinary 列出圖片失敗 */
  public static final String CLOUDINARY_LIST_FAILED = "9102";
  /** 回應格式錯誤（前端專用） */
  public static final String SYSTEM_BAD_RESPONSE = "9997";
  /** 無法連線後端（前端專用） */
  public static final String SYSTEM_OFFLINE = "9998";
  /** 未分類系統錯誤 */
  public static final String SYSTEM_ERROR = "9999";
}
