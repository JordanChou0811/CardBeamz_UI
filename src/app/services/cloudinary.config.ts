/**
 * Cloudinary 設定
 *
 * 使用步驟：
 * 1. 註冊 https://cloudinary.com（免費），在 Dashboard 取得 "Cloud name"。
 * 2. Settings → Upload → Upload presets → Add upload preset：
 *    - Signing Mode 設為 "Unsigned"
 *    - 命名（例如 cardbeamz_unsigned），可設定允許格式、大小、資料夾
 * 3. 把下面兩個值替換成你的 Cloud name 與 preset 名稱即可。
 */
export const CLOUDINARY = {
  cloudName: 'ddawye3go',
  uploadPreset: 'cardbeamz_unsigned',
  /**
   * 基底資料夾。實際上傳路徑會依「功能 / 子項目」自動往下分層，例如：
   *   cardbeamz/groups/CBZ01      （團拆金 · 各團分團照）
   *   cardbeamz/members/CBZ0000001（會員 · 抽到的卡片）
   *   cardbeamz/system            （系統圖示 / Logo）
   */
  baseFolder: 'cardbeamz',
};

export function isCloudinaryConfigured(): boolean {
  return (
    !!CLOUDINARY.cloudName &&
    CLOUDINARY.cloudName !== 'YOUR_CLOUD_NAME' &&
    !!CLOUDINARY.uploadPreset &&
    CLOUDINARY.uploadPreset !== 'YOUR_UNSIGNED_PRESET'
  );
}
