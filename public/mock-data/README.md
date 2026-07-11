# 模擬 API 資料夾（mock-data）

此資料夾把每支 API 用「功能 / 動作」分層存放，**每個 JSON 檔的內容就是該 API 的 Response（回應）**。

## 命名規則

- **APID = 功能**（一支 API）→ 用功能命名的「資料夾」，例如 `member`、`warehouse`。
- **OPID = 該功能底下的動作** → 用動作命名的「檔案」，例如 `login.json`、`checkout.json`。

```
mock-data/
  {apid}/            ← 功能（一支 API）
    {opid}.json      ← 該功能底下的一個動作，內容＝API 的 Response
```

每個檔案的 Response 格式：

```json
{
  "apid": "member",
  "opid": "login",
  "name": "會員登入",
  "returnCode": "0000",
  "returnMsg": "登入成功",
  "data": { }
}
```

## API 對照

| 功能（apid） | 說明     | 動作（opid）                                                      |
| ------------ | -------- | ---------------------------------------------------------------- |
| `member`     | 會員服務 | `login` 登入、`register` 申請會員、`send-verify-code` 手機驗證、`change-password` 更改密碼 |
| `warehouse`  | 倉庫服務 | `list` 倉庫一覽、`recycle` 回收、`exchange` 換團拆金、`checkout` 結帳 |
| `order`      | 訂單服務 | `list-placed` 已下單查詢、`list-shipped` 已寄出查詢、`ship` 出貨   |
| `credit`     | 團拆金   | `get-balance` 餘額查詢、`update` 餘額修改                          |
| `group`      | 團拆管理 | `list` 列表、`create` 新增、`update` 修改、`delete` 刪除           |
| `news`       | 消息服務 | `list` 消息列表、`save` 新增/修改、`delete` 刪除                   |
| `notify`     | 通知服務 | `send` 發送通知（Email / LINE）                                   |

前端可透過 `TelegramService.call(apid, opid)` 呼叫對應 API，取得 Response。
