package com.cardbeamz.news;

import com.cardbeamz.common.ApiResponse;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

  private final NewsService newsService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list() {
    return ApiResponse.ok("news", "list", "消息列表", newsService.list());
  }

  @PostMapping("/save")
  public ApiResponse<Map<String, Object>> save(@RequestBody SaveRequest req) {
    return ApiResponse.ok(
        "news",
        "save",
        "儲存消息",
        newsService.save(req.getId(), req.getTitle(), req.getContent(), req.getCategory()));
  }

  @PostMapping("/delete")
  public ApiResponse<Map<String, Object>> delete(@RequestBody IdRequest req) {
    return ApiResponse.ok("news", "delete", "刪除消息", newsService.delete(req.getId()));
  }

  @Data
  public static class SaveRequest {
    private String id;
    private String title;
    private String content;
    private String category;
  }

  @Data
  public static class IdRequest {
    private String id;
  }
}
