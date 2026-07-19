package com.cardbeamz.group;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface TeamSlotRepository extends JpaRepository<TeamSlot, String> {
  List<TeamSlot> findByGroupIdOrderByTeamCodeAsc(String groupId);

  Optional<TeamSlot> findByGroupIdAndTeamCode(String groupId, String teamCode);

  long countByGroupId(String groupId);

  long countByGroupIdAndStatus(String groupId, String status);

  @Modifying
  @Transactional
  void deleteByGroupId(String groupId);
}
