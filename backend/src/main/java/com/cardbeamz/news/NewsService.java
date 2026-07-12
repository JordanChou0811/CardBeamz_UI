package com.cardbeamz.news;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NewsService {

  private final NewsRepository newsRepository;

  public Map<String, Object> list() {
    List<NewsItem> items = newsRepository.findAllByOrderByCreatedAtDesc();
    Map<String, Object> data = new HashMap<>();
    data.put("total", items.size());
    data.put("news", items);
    return data;
  }

  @Transactional
  public Map<String, Object> save(String id, String title, String content, String category) {
    NewsItem item;
    if (id == null || id.isBlank()) {
      item =
          NewsItem.builder()
              .id(IdGenerator.next("NEWS"))
              .title(title)
              .content(content)
              .category(category)
              .createdAt(Instant.now())
              .build();
    } else {
      item =
          newsRepository
              .findById(id)
              .orElseThrow(() -> new ApiException("news", "save", "儲存消息", "5001", "消息不存在"));
      item.setTitle(title);
      item.setContent(content);
      item.setCategory(category);
    }
    newsRepository.save(item);
    return Map.of("news", item);
  }

  @Transactional
  public Map<String, Object> delete(String id) {
    if (!newsRepository.existsById(id)) {
      throw new ApiException("news", "delete", "刪除消息", "5001", "消息不存在");
    }
    newsRepository.deleteById(id);
    return Map.of("id", id);
  }
}
