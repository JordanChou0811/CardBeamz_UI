package com.cardbeamz.group;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StakePurchaseRepository extends JpaRepository<StakePurchase, String> {
  List<StakePurchase> findByGroupIdAndStatus(String groupId, String status);

  List<StakePurchase> findByMemberIdOrderByCreatedAtDesc(String memberId);
}
