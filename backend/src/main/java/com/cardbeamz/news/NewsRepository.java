package com.cardbeamz.news;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepository extends JpaRepository<NewsItem, String> {
  List<NewsItem> findAllByOrderByCreatedAtDesc();
}
