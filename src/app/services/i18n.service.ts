import { Injectable, signal } from '@angular/core';

export type Lang = 'zh' | 'en';

const LANG_KEY = 'cbz_lang';

type Dict = Record<string, { zh: string; en: string }>;

const DICT: Dict = {
  // ---- 共用 ----
  'app.name': { zh: 'CardBeamz', en: 'CardBeamz' },
  'common.login': { zh: '登入', en: 'Login' },
  'common.register': { zh: '加入會員', en: 'Join' },
  'common.logout': { zh: '登出', en: 'Logout' },
  'common.confirm': { zh: '確認', en: 'Confirm' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.save': { zh: '儲存', en: 'Save' },
  'common.next': { zh: '下一步', en: 'Next' },
  'common.prev': { zh: '上一步', en: 'Back' },
  'common.back': { zh: '← 回首頁', en: '← Home' },
  'common.account': { zh: '帳號', en: 'Account' },
  'common.password': { zh: '密碼', en: 'Password' },
  'common.name': { zh: '姓名', en: 'Name' },
  'common.phone': { zh: '聯絡電話', en: 'Phone' },
  'common.total': { zh: '總計', en: 'Total' },
  'common.yuan': { zh: '元', en: 'NT$' },
  'common.memberCenter': { zh: '會員中心', en: 'Member' },
  'common.adminPanel': { zh: '後台管理', en: 'Admin' },
  'common.frontend': { zh: '前台', en: 'Front' },
  'common.edit': { zh: '修改', en: 'Edit' },
  'common.delete': { zh: '刪除', en: 'Delete' },
  'confirm.irreversible': {
    zh: '此操作無法復原，確定要繼續嗎？',
    en: 'This cannot be undone. Continue?',
  },
  'confirm.deleteGroup': { zh: '確定刪除此團？', en: 'Delete this group?' },
  'confirm.deleteGroupCard': { zh: '確定刪除此卡片？', en: 'Delete this card?' },
  'confirm.removeItem': { zh: '確定收回此卡片？', en: 'Remove this card assignment?' },
  'confirm.deleteNews': { zh: '確定刪除此消息？', en: 'Delete this news item?' },
  'confirm.removeUpload': {
    zh: '確定從清單移除此圖片？（不會刪除 Cloudinary 上的檔案）',
    en: 'Remove this image from the list? (Cloudinary file is not deleted)',
  },
  'common.group': { zh: '團', en: 'Group' },
  'common.groupPhoto': { zh: '分團照', en: 'Photo' },
  'common.status': { zh: '狀態', en: 'Status' },

  // ---- 首頁 ----
  'landing.title': { zh: '卡牌倉儲與團務管理', en: 'Card Storage & Group Management' },
  'landing.subtitle': {
    zh: '寄倉、回收、換團拆金、代寄一站搞定。加入會員，輕鬆管理你的每一張卡與每一個團。',
    en: 'Storage, recycling, credit exchange and shipping in one place. Join to manage every card and group.',
  },
  'landing.joinNow': { zh: '立即加入會員', en: 'Join Now' },
  'landing.memberLogin': { zh: '會員登入', en: 'Member Login' },
  'landing.feat1.title': { zh: '我的倉庫', en: 'My Warehouse' },
  'landing.feat1.desc': { zh: '集中管理寄倉卡牌，一鍵回收或換團拆金。', en: 'Manage stored cards, recycle or exchange for credit in one click.' },
  'landing.feat2.title': { zh: '代寄服務', en: 'Shipping' },
  'landing.feat2.desc': { zh: '超商店到店、郵寄、自取，彈性選擇寄送方式。', en: 'Convenience store, mail or pickup — flexible delivery options.' },
  'landing.feat3.title': { zh: '團拆金', en: 'Group Credit' },
  'landing.feat3.desc': { zh: '換團拆金即時入帳，下次開團直接折抵。', en: 'Exchange for credit instantly, redeem on your next group order.' },
  'landing.feat4.title': { zh: '消息更新', en: 'News' },
  'landing.feat4.desc': { zh: '新增服務與系統維護資訊即時掌握。', en: 'Stay updated with new services and maintenance notices.' },
  'landing.footer': { zh: '© 2026 CardBeamz · 卡牌倉儲服務', en: '© 2026 CardBeamz · Card Storage Service' },

  // ---- 登入 ----
  'login.subtitle': { zh: '登入 CardBeamz 管理你的卡牌倉庫', en: 'Log in to manage your card warehouse' },
  'login.accountPlaceholder': { zh: '請輸入手機號碼，如 0912345678', en: 'Enter phone, e.g. 0912345678' },
  'login.passwordPlaceholder': { zh: '請輸入密碼', en: 'Enter password' },
  'login.remember': { zh: '記住我', en: 'Remember me' },
  'login.noAccount': { zh: '還沒有帳號？', en: "Don't have an account?" },
  'login.demoHint': {
    zh: '測試帳號：會員 0912345678 / 123456　·　管理員 0900000000 / admin',
    en: 'Demo: member 0912345678 / 123456 · admin 0900000000 / admin',
  },
  'login.errRequired': { zh: '帳號與密碼為必填', en: 'Account and password are required' },
  'login.errNoAccount': { zh: '查無此帳號', en: 'Account not found' },
  'login.errWrongPwd': { zh: '密碼錯誤', en: 'Incorrect password' },
  'login.errFail': { zh: '登入失敗', en: 'Login failed' },
  'login.errOffline': { zh: '無法連線後端，請先啟動 API（localhost:8080）', en: 'Cannot reach API. Start backend on localhost:8080' },

  // API returnCode → 使用者訊息（與 api-codes.ts / 後端 ReturnCodes 同步）
  'api.err.unknown': { zh: '發生未知錯誤', en: 'Unknown error' },
  'api.err.1001': { zh: '帳號或密碼錯誤', en: 'Incorrect account or password' },
  'api.err.1002': { zh: '驗證碼錯誤或已過期', en: 'Invalid or expired verification code' },
  'api.err.1003': { zh: '此手機號碼已被使用', en: 'This phone number is already in use' },
  'api.err.1004': { zh: '會員不存在', en: 'Member not found' },
  'api.err.1005': { zh: '舊密碼錯誤', en: 'Incorrect current password' },
  'api.err.1006': { zh: '帳號須為 09 開頭共 10 碼', en: 'Account must be 09 followed by 8 digits' },
  'api.err.1007': { zh: '不可修改管理員帳號', en: 'Cannot modify admin account' },
  'api.err.2001': { zh: '未選擇卡片', en: 'No cards selected' },
  'api.err.2002': { zh: '部分卡片不存在', en: 'Some cards do not exist' },
  'api.err.2003': { zh: '卡片狀態不可結帳', en: 'Card status cannot be checked out' },
  'api.err.2004': { zh: '卡片不存在', en: 'Card not found' },
  'api.err.2005': { zh: '卡片不在倉庫中', en: 'Card is not in warehouse' },
  'api.err.3001': { zh: '訂單不存在', en: 'Order not found' },
  'api.err.3002': { zh: '訂單狀態不可出貨', en: 'Order cannot be shipped' },
  'api.err.4001': { zh: '團代號已存在', en: 'Group code already exists' },
  'api.err.4002': { zh: '團不存在', en: 'Group not found' },
  'api.err.4101': { zh: '團卡片不存在', en: 'Group card not found' },
  'api.err.5001': { zh: '消息不存在', en: 'News item not found' },
  'api.err.9001': { zh: '參數錯誤', en: 'Invalid parameters' },
  'api.err.9101': {
    zh: '尚未設定 Cloudinary API Key／Secret。請編輯 backend/src/main/resources/application-local.yml 後重啟後端。',
    en: 'Cloudinary API Key/Secret not set. Edit application-local.yml and restart the backend.',
  },
  'api.err.9102': { zh: '無法列出 Cloudinary 圖片', en: 'Failed to list Cloudinary images' },
  'api.err.9997': { zh: '後端回應格式錯誤', en: 'Invalid API response' },
  'api.err.9998': { zh: '無法連線後端，請確認已啟動', en: 'Cannot reach backend' },
  'api.err.9999': { zh: '系統錯誤', en: 'System error' },

  // ---- 申請會員 ----
  'register.title': { zh: '申請會員', en: 'Sign Up' },
  'register.subtitle': { zh: '填寫資料即可加入 CardBeamz', en: 'Fill in the form to join CardBeamz' },
  'register.namePlaceholder': { zh: '請輸入姓名', en: 'Enter your name' },
  'register.digitsPlaceholder': { zh: '請輸入 8 碼數字', en: 'Enter 8 digits' },
  'register.accountHint': { zh: '帳號即手機號碼，09 後請填寫 8 個數字', en: 'Account is your phone; enter 8 digits after 09' },
  'register.verify': { zh: '手機號碼驗證', en: 'Verify Phone' },
  'register.resend': { zh: '重新發送驗證碼', en: 'Resend Code' },
  'register.codeSent': { zh: '模擬簡訊已發送，您的驗證碼為：', en: 'SMS sent (demo). Your code is: ' },
  'register.code': { zh: '驗證碼', en: 'Verification Code' },
  'register.codePlaceholder': { zh: '請輸入收到的驗證碼', en: 'Enter the code you received' },
  'register.passwordPlaceholder': { zh: '請設定密碼', en: 'Set a password' },
  'register.submit': { zh: '申請會員', en: 'Sign Up' },
  'register.haveAccount': { zh: '已經是會員？', en: 'Already a member?' },
  'register.goLogin': { zh: '前往登入', en: 'Go to Login' },
  'register.welcome': { zh: '歡迎加入 CardBeamz！', en: 'Welcome to CardBeamz!' },
  'register.success': { zh: '您已成功申請會員！', en: 'Your membership has been created!' },
  'register.yourNo': { zh: '您的會員編號：', en: 'Your member number: ' },
  'register.autoSent': { zh: '（系統已自動發送會員編號至您的手機）', en: '(Your member number has been sent to your phone)' },
  'register.gotoLogin': { zh: '跳轉至登入頁面', en: 'Go to Login Page' },
  'register.errName': { zh: '姓名為必填', en: 'Name is required' },
  'register.errDigits': { zh: '帳號需為 8 碼數字', en: 'Account must be 8 digits' },
  'register.errPhone': { zh: '請先填寫正確的 8 碼手機號碼', en: 'Enter a valid 8-digit phone first' },
  'register.errCodeFirst': { zh: '請先點擊手機號碼驗證取得驗證碼', en: 'Please request a verification code first' },
  'register.errCode': { zh: '驗證碼錯誤', en: 'Incorrect verification code' },
  'register.errPwd': { zh: '密碼為必填', en: 'Password is required' },
  'register.errDup': { zh: '此手機號碼已被註冊', en: 'This phone is already registered' },
  'register.errSend': { zh: '驗證碼發送失敗', en: 'Failed to send verification code' },
  'register.errFail': { zh: '註冊失敗', en: 'Registration failed' },

  // ---- 會員版面 ----
  'nav.warehouse': { zh: '我的倉庫', en: 'My Warehouse' },
  'nav.orders': { zh: '已下單/已寄出', en: 'Orders / Shipped' },
  'nav.recycled': { zh: '已回收/已換團拆金', en: 'Recycled / Exchanged' },
  'nav.credit': { zh: '團拆金', en: 'Credit' },
  'nav.changePwd': { zh: '更改密碼', en: 'Change Password' },
  'nav.news': { zh: '消息更新', en: 'News' },

  // ---- 倉庫 ----
  'wh.title': { zh: '我的倉庫', en: 'My Warehouse' },
  'wh.step1': { zh: '倉庫一覽', en: 'Warehouse' },
  'wh.step2': { zh: '寄送方式', en: 'Shipping' },
  'wh.empty': { zh: '倉庫目前沒有卡牌', en: 'No cards in your warehouse' },
  'wh.selectAll': { zh: '全選', en: 'Select All' },
  'wh.recycleExchange': { zh: '回收 / 換團拆金', en: 'Recycle / Exchange' },
  'wh.recycle': { zh: '回收', en: 'Recycle' },
  'wh.exchange': { zh: '換團拆金', en: 'Exchange' },
  'wh.selectedCount': { zh: '已勾選', en: 'Selected' },
  'wh.items': { zh: '項', en: 'items' },
  'wh.chooseShipping': { zh: '選擇寄送方式', en: 'Choose Shipping Method' },
  'wh.cvs': { zh: '超商店到店', en: 'Convenience Store' },
  'wh.mail': { zh: '郵寄', en: 'Mail' },
  'wh.pickup': { zh: '自取', en: 'Pickup' },
  'wh.chooseCvs': { zh: '選擇超商（擇一）', en: 'Choose a store (pick one)' },
  'wh.storeName': { zh: '門市名稱', en: 'Store Name' },
  'wh.storeAddress': { zh: '門市地址', en: 'Store Address' },
  'wh.address': { zh: '地址（含郵遞區號）', en: 'Address (with postal code)' },
  'wh.lineId': { zh: 'Line ID', en: 'Line ID' },
  'wh.lineName': { zh: 'Line 用戶名稱', en: 'Line Username' },
  'wh.checkout': { zh: '結帳', en: 'Checkout' },
  'wh.recycleConfirm': { zh: '請確認回收！', en: 'Confirm recycle!' },
  'wh.exchangeConfirm': { zh: '請確認換團拆金', en: 'Confirm exchange for credit' },
  'wh.errCvs': { zh: '請選擇超商', en: 'Please choose a store' },
  'wh.errRequired': { zh: '請填寫所有必填欄位', en: 'Please fill in all required fields' },

  // ---- 訂單 ----
  'orders.title': { zh: '我的訂單', en: 'My Orders' },
  'orders.placed': { zh: '已下單', en: 'Placed' },
  'orders.shipped': { zh: '已寄出', en: 'Shipped' },
  'orders.emptyPlaced': { zh: '目前沒有已下單的訂單', en: 'No placed orders' },
  'orders.emptyShipped': { zh: '目前沒有已寄出的訂單', en: 'No shipped orders' },
  'orders.order': { zh: '訂單', en: 'Order' },
  'orders.itemsTotal': { zh: '共', en: 'Total' },
  'orders.itemsUnit': { zh: '項', en: 'items' },

  // ---- 回收/換團拆金 ----
  'recycled.title': { zh: '已回收 / 已換團拆金', en: 'Recycled / Exchanged' },
  'recycled.recycled': { zh: '已回收', en: 'Recycled' },
  'recycled.exchanged': { zh: '已換團拆金', en: 'Exchanged for Credit' },
  'recycled.emptyRecycled': { zh: '尚無已回收項目', en: 'No recycled items' },
  'recycled.emptyExchanged': { zh: '尚無已換團拆金項目', en: 'No exchanged items' },

  // ---- 團拆金 ----
  'credit.title': { zh: '團拆金', en: 'Group Credit' },
  'credit.balance': { zh: '目前團拆金剩餘', en: 'Current Credit Balance' },
  'credit.note': { zh: '說明', en: 'Note' },
  'credit.noteText': {
    zh: '請在 Line 群組「+團」後，結帳時截圖團拆金剩餘，並告知使用多少團拆金！',
    en: 'After joining a group in Line, screenshot your credit balance at checkout and tell us how much credit you used!',
  },

  // ---- 更改密碼 ----
  'pwd.title': { zh: '更改密碼', en: 'Change Password' },
  'pwd.old': { zh: '舊密碼', en: 'Old Password' },
  'pwd.new': { zh: '新密碼', en: 'New Password' },
  'pwd.confirm': { zh: '新密碼確認', en: 'Confirm New Password' },
  'pwd.submit': { zh: '確認更改', en: 'Change' },
  'pwd.ok': { zh: '密碼已更新成功！', en: 'Password updated successfully!' },
  'pwd.errRequired': { zh: '所有欄位皆為必填', en: 'All fields are required' },
  'pwd.errOld': { zh: '舊密碼錯誤', en: 'Old password is incorrect' },
  'pwd.errMismatch': { zh: '新密碼與確認不一致', en: 'New passwords do not match' },

  // ---- 消息 ----
  'news.title': { zh: '消息更新', en: 'News' },
  'news.empty': { zh: '目前沒有最新消息', en: 'No news yet' },
  'news.service': { zh: '新增服務', en: 'New Service' },
  'news.maintenance': { zh: '系統維修', en: 'Maintenance' },

  // ---- 後台 ----
  'admin.title': { zh: 'CardBeamz 管理後台', en: 'CardBeamz Admin' },
  'admin.nav.orders': { zh: '出貨訂單管理', en: 'Order Management' },
  'admin.nav.members': { zh: '會員管理', en: 'Members' },
  'admin.nav.pages': { zh: '新增/修改頁面', en: 'Pages' },
  'admin.nav.notify': { zh: '訊息通知', en: 'Notifications' },
  'admin.brand': { zh: '後台管理', en: 'Admin' },

  // 後台訂單
  'aorders.title': { zh: '出貨訂單管理', en: 'Order Management' },
  'aorders.pending': { zh: '待出貨（已下單）', en: 'Pending (Placed)' },
  'aorders.shipped': { zh: '已寄出', en: 'Shipped' },
  'aorders.emptyPending': { zh: '沒有待出貨訂單', en: 'No pending orders' },
  'aorders.emptyShipped': { zh: '沒有已寄出訂單', en: 'No shipped orders' },
  'aorders.member': { zh: '會員', en: 'Member' },
  'aorders.ship': { zh: '寄出', en: 'Ship' },
  'aorders.shippedAt': { zh: '已寄出', en: 'Shipped at' },

  // 後台會員
  'amembers.title': { zh: '會員管理', en: 'Member Management' },
  'amembers.list': { zh: '會員資料一覽', en: 'Member List' },
  'amembers.no': { zh: '會員編號', en: 'Member No.' },
  'amembers.accountPhone': { zh: '帳號（手機號碼）', en: 'Account (Phone)' },
  'amembers.credit': { zh: '團拆金', en: 'Credit' },
  'amembers.action': { zh: '操作', en: 'Action' },
  'amembers.add': { zh: '新增會員', en: 'Add Member' },
  'amembers.edit': { zh: '修改', en: 'Edit' },
  'amembers.editCredit': { zh: '修改團拆金', en: 'Edit Credit' },
  'amembers.member': { zh: '會員', en: 'Member' },
  'amembers.creditAmount': { zh: '團拆金金額', en: 'Credit Amount' },
  'amembers.pwdOptional': { zh: '空白則不變更', en: 'Leave blank to keep' },
  'amembers.errName': { zh: '請填寫姓名', en: 'Name is required' },
  'amembers.errAccount': { zh: '手機號碼需為 8 碼數字', en: 'Phone must be 8 digits' },
  'amembers.errPassword': { zh: '請設定密碼', en: 'Password is required' },
  'amembers.errDup': { zh: '此手機號碼已被使用', en: 'Phone already in use' },
  'amembers.errFail': { zh: '儲存失敗', en: 'Save failed' },

  // 後台頁面
  'apages.title': { zh: '新增 / 修改頁面（消息更新）', en: 'Pages (News)' },
  'apages.editNews': { zh: '修改消息', en: 'Edit News' },
  'apages.addNews': { zh: '新增消息', en: 'Add News' },
  'apages.category': { zh: '分類', en: 'Category' },
  'apages.titleField': { zh: '標題', en: 'Title' },
  'apages.titlePlaceholder': { zh: '請輸入標題', en: 'Enter title' },
  'apages.content': { zh: '內容', en: 'Content' },
  'apages.contentPlaceholder': { zh: '請輸入內容', en: 'Enter content' },
  'apages.add': { zh: '新增', en: 'Add' },
  'apages.saveEdit': { zh: '儲存修改', en: 'Save' },
  'apages.published': { zh: '已發布消息', en: 'Published News' },
  'apages.emptyNews': { zh: '尚無消息', en: 'No news' },
  'apages.errRequired': { zh: '標題與內容為必填', en: 'Title and content are required' },

  // 後台通知
  'notify.title': { zh: '訊息通知', en: 'Notifications' },
  'notify.send': { zh: '發送通知', en: 'Send Notification' },
  'notify.channel': { zh: '通知管道', en: 'Channel' },
  'notify.target': { zh: '發送對象', en: 'Recipient' },
  'notify.allMembers': { zh: '全體會員', en: 'All Members' },
  'notify.people': { zh: '人', en: '' },
  'notify.content': { zh: '通知內容', en: 'Message' },
  'notify.contentPlaceholder': { zh: '輸入要發送的訊息', en: 'Enter the message to send' },
  'notify.mockHint': {
    zh: '（此為模擬發送，實際串接 Email / LINE Notify API 時可替換為真實服務）',
    en: '(Mock send — replace with real Email / LINE Notify API when integrating.)',
  },
  'notify.log': { zh: '發送紀錄', en: 'Send Log' },
  'notify.emptyLog': { zh: '尚無發送紀錄', en: 'No send records yet' },
  'notify.errContent': { zh: '請輸入通知內容', en: 'Please enter a message' },
  'notify.errSend': { zh: '通知發送失敗', en: 'Failed to send notification' },

  // ---- 團拆管理 ----
  'admin.nav.groups': { zh: '團拆管理', en: 'Groups' },
  'groups.title': { zh: '團拆管理', en: 'Group Management' },
  'groups.add': { zh: '新增團', en: 'Add Group' },
  'groups.edit': { zh: '修改團', en: 'Edit Group' },
  'groups.code': { zh: '團代號', en: 'Group Code' },
  'groups.codePlaceholder': { zh: '例如 CBZ01', en: 'e.g. CBZ01' },
  'groups.name': { zh: '團名稱', en: 'Group Name' },
  'groups.namePlaceholder': { zh: '請輸入團名稱', en: 'Enter group name' },
  'groups.exchange': { zh: '換團拆金金額', en: 'Exchange Value' },
  'groups.photo': { zh: '分團照', en: 'Group Photo' },
  'groups.photoUrl': { zh: '圖片網址（或色碼）', en: 'Image URL (or color)' },
  'groups.pickPhoto': { zh: '從已上傳選擇', en: 'Pick from uploads' },
  'groups.list': { zh: '團列表', en: 'Group List' },
  'groups.empty': { zh: '尚無團，請先新增', en: 'No groups yet, please add one' },
  'groups.errRequired': { zh: '團代號與名稱為必填', en: 'Code and name are required' },
  'groups.selectImage': { zh: '選擇已上傳圖片', en: 'Select Uploaded Image' },
  'groups.noUploads': {
    zh: '尚無已上傳圖片，請先到「圖片上傳」上傳。',
    en: 'No uploads yet. Please upload via "Upload Images" first.',
  },
  'groups.manageCards': { zh: '管理卡片', en: 'Manage Cards' },
  'groups.cardsTitle': { zh: '團卡片目錄', en: 'Group Card Catalog' },
  'groups.cardsHint': {
    zh: '在此維護該團的卡片；分派給會員時從此目錄選取。',
    en: 'Maintain cards for this group; assign to members from this catalog.',
  },
  'groups.addCard': { zh: '新增卡片', en: 'Add Card' },
  'groups.editCard': { zh: '修改卡片', en: 'Edit Card' },
  'groups.cardsEmpty': { zh: '此團尚無卡片，請先新增', en: 'No cards in this group yet' },
  'groups.backToGroups': { zh: '返回團列表', en: 'Back to groups' },
  'groups.cardErrRequired': { zh: '請至少填寫卡名或卡號', en: 'Enter a card name or number' },
  'groups.pickCardPhoto': { zh: '選擇卡片圖', en: 'Choose card image' },
  'groups.pickCardPhotoTitle': { zh: '選擇該團資料夾圖片', en: 'Pick from group folder' },
  'groups.folderEmpty': {
    zh: '此團資料夾尚無圖片，請先到「圖片上傳」上傳。',
    en: 'No images in this group folder yet. Upload via "Upload Images" first.',
  },
  'groups.loadingImages': { zh: '載入圖片中…', en: 'Loading images…' },
  'groups.loadMoreImages': { zh: '載入更多', en: 'Load more' },

  // ---- 分派卡片 ----
  'admin.nav.items': { zh: '分派卡片', en: 'Assign Cards' },
  'aitems.title': { zh: '分派卡片給會員', en: 'Assign Cards to Members' },
  'aitems.assign': { zh: '分派卡片', en: 'Assign Card' },
  'aitems.member': { zh: '會員', en: 'Member' },
  'aitems.selectMember': { zh: '請選擇會員', en: 'Select a member' },
  'aitems.group': { zh: '團', en: 'Group' },
  'aitems.selectGroup': { zh: '請選擇團', en: 'Select a group' },
  'aitems.noGroups': {
    zh: '尚無團，請先到「團拆管理」新增團。',
    en: 'No groups yet. Please add one in "Group Management" first.',
  },
  'aitems.card': { zh: '卡名/卡號', en: 'Card' },
  'aitems.selectCard': { zh: '請選擇卡片', en: 'Select a card' },
  'aitems.noCards': {
    zh: '此團尚無卡片，請到「團拆管理」→ 管理卡片 新增。',
    en: 'No cards yet. Add them under Group Management → Manage Cards.',
  },
  'aitems.cardName': { zh: '卡名', en: 'Card Name' },
  'aitems.cardNamePlaceholder': { zh: '例如：皮卡丘 SP', en: 'e.g. Pikachu SP' },
  'aitems.cardNo': { zh: '卡號', en: 'Card No.' },
  'aitems.cardNoPlaceholder': { zh: '例如：001 / SP-01', en: 'e.g. 001 / SP-01' },
  'aitems.cardPhoto': { zh: '卡片圖', en: 'Card Image' },
  'aitems.useGroupPhoto': { zh: '用團預設圖', en: 'Group default' },
  'aitems.noCardImages': {
    zh: '此團尚無已上傳卡圖。可到「圖片上傳」上傳到該團資料夾後再選。',
    en: 'No card images uploaded for this group yet. Upload to the group folder via "Upload Images".',
  },
  'aitems.quantity': { zh: '數量', en: 'Quantity' },
  'aitems.assignBtn': { zh: '分派給會員', en: 'Assign to Member' },
  'aitems.errRequired': { zh: '請選擇會員、團與卡片', en: 'Please select member, group and card' },
  'aitems.assigned': { zh: '已成功分派', en: 'Assigned' },
  'aitems.listTitle': { zh: '倉庫中卡片（待會員處理）', en: 'Cards in Warehouse (pending)' },
  'aitems.empty': { zh: '尚無已分派卡片', en: 'No assigned cards yet' },
  'aitems.assignedAt': { zh: '分派時間', en: 'Assigned At' },
  'aitems.remove': { zh: '收回', en: 'Remove' },

  // ---- 圖片上傳 ----
  'admin.nav.upload': { zh: '圖片上傳', en: 'Upload Images' },
  'upload.title': { zh: '圖片上傳', en: 'Image Upload' },
  'upload.notConfigured': {
    zh: '尚未設定 Cloudinary。請在 src/app/services/cloudinary.config.ts 填入 Cloud name 與 Upload preset。',
    en: 'Cloudinary is not configured. Please set Cloud name and Upload preset in src/app/services/cloudinary.config.ts.',
  },
  'upload.dropHere': { zh: '拖曳圖片到此，或點擊選擇檔案', en: 'Drag images here, or click to choose files' },
  'upload.choose': { zh: '選擇檔案', en: 'Choose Files' },
  'upload.selected': { zh: '已選擇', en: 'Selected' },
  'upload.uploadBtn': { zh: '開始上傳', en: 'Upload' },
  'upload.uploading': { zh: '上傳中…', en: 'Uploading…' },
  'upload.success': { zh: '上傳成功！', en: 'Uploaded successfully!' },
  'upload.copy': { zh: '複製網址', en: 'Copy URL' },
  'upload.copied': { zh: '已複製', en: 'Copied' },
  'upload.gallery': { zh: '已上傳圖片', en: 'Uploaded Images' },
  'upload.emptyGallery': { zh: '尚無已上傳圖片', en: 'No uploaded images yet' },
  'upload.remove': { zh: '從清單移除', en: 'Remove' },
  'upload.errType': { zh: '僅支援圖片檔（jpg / png / webp / gif）', en: 'Image files only (jpg / png / webp / gif)' },
  'upload.hint': { zh: '上傳後複製網址，即可貼到「分團照」欄位使用。', en: 'After uploading, copy the URL to use in the group photo field.' },
  'upload.folder': { zh: '儲存位置', en: 'Destination' },
  'upload.category': { zh: '功能分類', en: 'Category' },
  'upload.cat.groups': { zh: '團拆金 · 分團照', en: 'Group Credit · Group Photos' },
  'upload.cat.members': { zh: '會員 · 卡片', en: 'Members · Cards' },
  'upload.cat.system': { zh: '系統 · 圖示 / Logo', en: 'System · Logos' },
  'upload.group': { zh: '團', en: 'Group' },
  'upload.selectGroup': { zh: '請選擇團', en: 'Select a group' },
  'upload.noGroups': {
    zh: '尚無團，請先到「團拆管理」新增。',
    en: 'No groups yet. Please add one in "Group Management" first.',
  },
  'upload.groupPlaceholder': { zh: '輸入或選擇團，例如 CBZ01', en: 'Enter or select a group, e.g. CBZ01' },
  'upload.member': { zh: '會員', en: 'Member' },
  'upload.selectMember': { zh: '請選擇會員', en: 'Select a member' },
  'upload.targetPath': { zh: '上傳路徑', en: 'Upload path' },
  'upload.needSub': { zh: '請先選擇或輸入子資料夾', en: 'Please choose a subfolder first' },
  'upload.folderCol': { zh: '資料夾', en: 'Folder' },

  // ---- 控制列 ----
  'ctl.lang': { zh: '中', en: 'EN' },
  'ctl.themePink': { zh: '亮色', en: 'Light' },
  'ctl.themeStarry': { zh: '星空', en: 'Starry' },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>((localStorage.getItem(LANG_KEY) as Lang) || 'zh');

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
  }

  toggle(): void {
    this.setLang(this.lang() === 'zh' ? 'en' : 'zh');
  }

  t(id: string): string {
    const entry = DICT[id];
    if (!entry) return id;
    return entry[this.lang()] ?? id;
  }
}
