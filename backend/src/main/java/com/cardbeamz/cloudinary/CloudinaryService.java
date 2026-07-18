package com.cardbeamz.cloudinary;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.ReturnCodes;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Cloudinary Admin API 代理（密鑰只放後端）。
 *
 * <p>錯誤碼：
 * <ul>
 *   <li>9101 未設定 Cloudinary</li>
 *   <li>9102 列出圖片失敗</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class CloudinaryService {

  private final CloudinaryProperties props;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

  /**
   * 列出資料夾內圖片（依 public_id prefix）。
   *
   * @param folder 完整 folder，例如 cardbeamz/groups/CBZ01；空則用 baseFolder
   * @param nextCursor 分頁游標（可空）
   */
  public Map<String, Object> listByFolder(String folder, String nextCursor) {
    requireConfigured();
    String prefix = normalizeFolder(folder);
    try {
      StringBuilder url =
          new StringBuilder("https://api.cloudinary.com/v1_1/")
              .append(encode(props.getCloudName()))
              .append("/resources/image?type=upload&max_results=100&prefix=")
              .append(encode(prefix));
      if (nextCursor != null && !nextCursor.isBlank()) {
        url.append("&next_cursor=").append(encode(nextCursor.trim()));
      }

      HttpRequest request =
          HttpRequest.newBuilder(URI.create(url.toString()))
              .timeout(Duration.ofSeconds(20))
              .header("Authorization", basicAuth())
              .GET()
              .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        String code =
            response.statusCode() == 401 || response.statusCode() == 403
                ? ReturnCodes.CLOUDINARY_NOT_CONFIGURED
                : ReturnCodes.CLOUDINARY_LIST_FAILED;
        String detail = cloudinaryErrorDetail(response.body());
        throw new ApiException(
            "cloudinary",
            "list",
            "Cloudinary 圖庫",
            code,
            "Cloudinary 列出圖片失敗（HTTP "
                + response.statusCode()
                + (detail.isBlank() ? "" : "：" + detail)
                + "）");
      }

      JsonNode root = objectMapper.readTree(response.body());
      List<Map<String, Object>> images = new ArrayList<>();
      JsonNode resources = root.path("resources");
      if (resources.isArray()) {
        for (JsonNode node : resources) {
          Map<String, Object> img = new HashMap<>();
          String publicId = text(node, "public_id");
          img.put("publicId", publicId);
          img.put("url", text(node, "secure_url"));
          img.put("folder", text(node, "folder"));
          img.put("name", fileName(publicId));
          img.put("createdAt", text(node, "created_at"));
          img.put("width", node.path("width").asInt(0));
          img.put("height", node.path("height").asInt(0));
          images.add(img);
        }
      }

      Map<String, Object> data = new HashMap<>();
      data.put("folder", prefix);
      data.put("total", images.size());
      data.put("images", images);
      String cursor = text(root, "next_cursor");
      if (!cursor.isBlank()) {
        data.put("nextCursor", cursor);
      }
      return data;
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(
          "cloudinary",
          "list",
          "Cloudinary 圖庫",
          ReturnCodes.CLOUDINARY_LIST_FAILED,
          "Cloudinary 列出圖片失敗：" + e.getMessage());
    }
  }

  /** 團資料夾路徑：{baseFolder}/groups/{groupCode} */
  public String groupFolder(String groupCode) {
    String code = groupCode == null ? "" : groupCode.trim().split("\\s+")[0].replaceAll("[\\\\/?#%]", "");
    if (code.isBlank()) {
      throw new ApiException(
          "cloudinary", "list", "Cloudinary 圖庫", ReturnCodes.SYSTEM_VALIDATION, "團代號不可為空");
    }
    String base = props.getBaseFolder() == null || props.getBaseFolder().isBlank() ? "cardbeamz" : props.getBaseFolder().trim();
    return base + "/groups/" + code;
  }

  private void requireConfigured() {
    if (!props.isConfigured()) {
      throw new ApiException(
          "cloudinary",
          "list",
          "Cloudinary 圖庫",
          ReturnCodes.CLOUDINARY_NOT_CONFIGURED,
          "尚未設定 Cloudinary API Key／Secret");
    }
  }

  private String normalizeFolder(String folder) {
    if (folder == null || folder.isBlank()) {
      return props.getBaseFolder() == null || props.getBaseFolder().isBlank()
          ? "cardbeamz"
          : props.getBaseFolder().trim();
    }
    String f = folder.trim().replaceAll("^/+|/+$", "");
    // 避免任意掃整個帳號：必須落在 baseFolder 底下
    String base =
        props.getBaseFolder() == null || props.getBaseFolder().isBlank()
            ? "cardbeamz"
            : props.getBaseFolder().trim();
    if (!f.equals(base) && !f.startsWith(base + "/")) {
      throw new ApiException(
          "cloudinary",
          "list",
          "Cloudinary 圖庫",
          ReturnCodes.SYSTEM_VALIDATION,
          "僅允許查詢 " + base + " 底下的資料夾");
    }
    return f;
  }

  private String basicAuth() {
    String raw = props.getApiKey() + ":" + props.getApiSecret();
    return "Basic " + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private static String text(JsonNode node, String field) {
    JsonNode v = node.get(field);
    return v == null || v.isNull() ? "" : v.asText("");
  }

  private static String fileName(String publicId) {
    if (publicId == null || publicId.isBlank()) return "";
    int slash = publicId.lastIndexOf('/');
    return slash >= 0 ? publicId.substring(slash + 1) : publicId;
  }

  private String cloudinaryErrorDetail(String body) {
    if (body == null || body.isBlank()) return "";
    try {
      JsonNode err = objectMapper.readTree(body).path("error").path("message");
      if (!err.isMissingNode() && !err.asText("").isBlank()) {
        return err.asText();
      }
    } catch (Exception ignored) {
      /* ignore */
    }
    return body.length() > 160 ? body.substring(0, 160) : body;
  }
}
