# 照片資料夾（photos）

此資料夾專門存放網站使用的照片（例如分團照、卡牌圖片等）。

## 使用方式

把圖片放進這個資料夾後，因為位於 `public/`，會被服務在網站根路徑，可直接以 `/photos/檔名` 引用。

範例：

```
public/photos/cbz01.jpg   →   <img src="/photos/cbz01.jpg" />
```

在 Angular 樣板中：

```html
<img [src]="'/photos/' + item.groupPhoto" alt="分團照" />
```

建議命名以英文/數字為主，避免空格與特殊字元。


