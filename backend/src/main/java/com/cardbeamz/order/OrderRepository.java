package com.cardbeamz.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
  List<OrderEntity> findByStatusOrderByCreatedAtDesc(String status);

  List<OrderEntity> findByMemberIdAndStatusOrderByCreatedAtDesc(String memberId, String status);

  List<OrderEntity> findByMemberIdOrderByCreatedAtDesc(String memberId);
}
