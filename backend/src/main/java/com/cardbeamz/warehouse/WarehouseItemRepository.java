package com.cardbeamz.warehouse;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseItemRepository extends JpaRepository<WarehouseItem, String> {
  List<WarehouseItem> findByMemberIdAndStatus(String memberId, String status);

  List<WarehouseItem> findByMemberId(String memberId);

  List<WarehouseItem> findByStatus(String status);

  List<WarehouseItem> findByIdIn(List<String> ids);

  Page<WarehouseItem> findByMemberIdAndStatus(String memberId, String status, Pageable pageable);

  Page<WarehouseItem> findByMemberId(String memberId, Pageable pageable);

  Page<WarehouseItem> findByStatus(String status, Pageable pageable);
}
