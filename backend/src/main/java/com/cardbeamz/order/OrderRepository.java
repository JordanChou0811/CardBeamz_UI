package com.cardbeamz.order;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
  List<OrderEntity> findByStatusOrderByCreatedAtDesc(String status);

  List<OrderEntity> findByMemberIdAndStatusOrderByCreatedAtDesc(String memberId, String status);

  List<OrderEntity> findByMemberIdOrderByCreatedAtDesc(String memberId);

  Page<OrderEntity> findByStatus(String status, Pageable pageable);

  Page<OrderEntity> findByMemberIdAndStatus(String memberId, String status, Pageable pageable);
}
