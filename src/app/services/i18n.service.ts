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
  'amembers.editCredit': { zh: '修改團拆金', en: 'Edit Credit' },
  'amembers.member': { zh: '會員', en: 'Member' },
  'amembers.creditAmount': { zh: '團拆金金額', en: 'Credit Amount' },

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
  'aitems.cardName': { zh: '卡名', en: 'Card Name' },
  'aitems.cardNamePlaceholder': { zh: '例如：皮卡丘 SP', en: 'e.g. Pikachu SP' },
  'aitems.cardNo': { zh: '卡號', en: 'Card No.' },
  'aitems.cardNoPlaceholder': { zh: '例如：001 / SP-01', en: 'e.g. 001 / SP-01' },
  'aitems.cardPhoto': { zh: '卡片圖（這張卡）', en: 'Card Image (this card)' },
  'aitems.useGroupPhoto': { zh: '用團預設圖', en: 'Group default' },
  'aitems.noCardImages': {
    zh: '此團尚無已上傳卡圖。可到「圖片上傳」上傳到該團資料夾後再選。',
    en: 'No card images uploaded for this group yet. Upload to the group folder via "Upload Images".',
  },
  'aitems.quantity': { zh: '數量', en: 'Quantity' },
  'aitems.assignBtn': { zh: '分派給會員', en: 'Assign to Member' },
  'aitems.errRequired': { zh: '請選擇會員與團', en: 'Please select a member and a group' },
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
