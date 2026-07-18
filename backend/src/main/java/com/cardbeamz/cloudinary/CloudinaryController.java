package com.cardbeamz.cloudinary;

import com.cardbeamz.common.ApiResponse;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cloudinary")
@RequiredArgsConstructor
public class CloudinaryController {

  private final CloudinaryService cloudinaryService;

  /**
   * 列出資料夾圖片。
   *
   * <p>可用 {@code groupCode=CBZ01}（自動組成 base/groups/CBZ01），或直接傳 {@code folder=}。
   */
  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list(
      @RequestParam(required = false) String folder,
      @RequestParam(required = false) String groupCode,
      @RequestParam(required = false) String nextCursor) {
    String target = folder;
    if ((target == null || target.isBlank()) && groupCode != null && !groupCode.isBlank()) {
      target = cloudinaryService.groupFolder(groupCode);
    }
    return ApiResponse.ok(
        "cloudinary", "list", "Cloudinary 圖庫", cloudinaryService.listByFolder(target, nextCursor));
  }
}
