package com.cardbeamz.group;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface GroupCardRepository extends JpaRepository<GroupCard, String> {
  List<GroupCard> findByGroupIdOrderByCreatedAtDesc(String groupId);

  @Modifying
  @Transactional
  void deleteByGroupId(String groupId);
}
