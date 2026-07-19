package com.cardbeamz.group;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
  List<CartItem> findByMemberIdOrderByUpdatedAtDesc(String memberId);

  Optional<CartItem> findByMemberIdAndGroupIdAndTeamSlotIdIsNull(String memberId, String groupId);

  Optional<CartItem> findByMemberIdAndTeamSlotId(String memberId, String teamSlotId);

  @Modifying
  @Transactional
  void deleteByGroupId(String groupId);

  @Modifying
  @Transactional
  void deleteByMemberIdAndGroupIdAndTeamSlotIdIsNull(String memberId, String groupId);

  @Modifying
  @Transactional
  void deleteByMemberIdAndTeamSlotId(String memberId, String teamSlotId);

  @Modifying
  @Transactional
  void deleteByTeamSlotId(String teamSlotId);
}
