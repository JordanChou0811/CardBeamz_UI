# CardBeamz Backend（Spring Boot）

REST API，路徑對齊前端 `public/mock-data/{apid}/{opid}`。

## 需求

- JDK 21+（本機已可用 Java 24）
- Maven 3.9+（或 IDE 內建 Maven）

## 啟動（本機 H2）

本機若 `mvn` / `mvnw` 有問題，請用：

```powershell
cd backend
.\run.ps1
```

（會使用 `%USERPROFILE%\tools\apache-maven-3.9.6`）

已安裝 Maven 並加入 PATH 也可用 `mvn spring-boot:run`。

服務位址：`http://localhost:8080`  
H2 Console：`http://localhost:8080/h2-console`  
（JDBC URL：`jdbc:h2:file:./data/cardbeamz`，帳號 `sa`，密碼空白）

### 示範帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理員 | `0900000000` | `admin` |
| 會員 | `0912345678` | `123456` |

## 換成雲端 PostgreSQL

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

環境變數：

```text
DB_URL=jdbc:postgresql://host:5432/cardbeamz
DB_USER=postgres
DB_PASSWORD=secret
```

## API 一覽

| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/member/list` | 會員列表（後台） |
| GET | `/api/member/me` | 當前會員 |
| POST | `/api/member/login` | 登入 |
| POST | `/api/member/register` | 註冊 |
| POST | `/api/member/send-verify-code` | 驗證碼（開發會回 `debugCode`） |
| POST | `/api/member/change-password` | 改密碼 |
| POST | `/api/member/create` | 後台新增會員 |
| POST | `/api/member/update` | 後台修改會員 |
| GET | `/api/warehouse/list?memberId=` | 倉庫一覽 |
| POST | `/api/warehouse/recycle` | 回收 |
| POST | `/api/warehouse/exchange` | 換團拆金 |
| POST | `/api/warehouse/checkout` | 結帳代寄 |
| POST | `/api/warehouse/assign` | 後台分派卡片 |
| POST | `/api/warehouse/remove` | 後台刪除卡片 |
| GET | `/api/order/list-placed` | 已下單 |
| GET | `/api/order/list-shipped` | 已寄出 |
| POST | `/api/order/ship` | 出貨 |
| GET | `/api/credit/get-balance?memberId=` | 團拆金餘額 |
| POST | `/api/credit/update` | 修改餘額 |
| GET | `/api/group/list` | 團列表 |
| POST | `/api/group/create` | 新增團 |
| POST | `/api/group/update` | 修改團 |
| POST | `/api/group/delete` | 刪除團 |
| GET | `/api/news/list` | 消息列表 |
| POST | `/api/news/save` | 新增／修改消息 |
| POST | `/api/news/delete` | 刪除消息 |
| POST | `/api/notify/send` | 發送通知（目前模擬） |
| GET | `/api/group-card/list?groupId=` | 團卡片目錄 |
| POST | `/api/group-card/create` | 新增團卡片 |
| POST | `/api/group-card/update` | 修改團卡片 |
| POST | `/api/group-card/delete` | 刪除團卡片 |
| GET | `/api/cloudinary/list?groupCode=` | 列出該團 Cloudinary 資料夾圖片 |

### Cloudinary（列圖庫）

上傳仍由前端 unsigned preset 直連 Cloudinary；**列出資料夾**需後端 Admin API。

本機建議（密鑰不進 git）：

```powershell
cd backend
copy src\main\resources\application-local.yml.example src\main\resources\application-local.yml
# 編輯 application-local.yml，填入 Dashboard → Settings → API Keys 的 Key / Secret
.\run.ps1
```

`run.ps1` 若偵測到 `application-local.yml` 會自動加 `--spring.profiles.active=local`。

也可用環境變數：`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`（或可選的 `cloudinary.local.ps1`）。

回應格式與 mock-data 相同：

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

## 與前端串接

| 指令 | 模式 |
|------|------|
| `npm start` 或 `npm run start:mock` | 模擬（localStorage，不需後端） |
| `npm run start:api` | 連真實後端 `http://localhost:8080` |

連後端時啟動順序：
1. `cd backend` → `.\run.ps1`
2. 專案根目錄 → `npm run start:api`
3. 開 `http://localhost:4300`
