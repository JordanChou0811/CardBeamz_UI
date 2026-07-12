package com.cardbeamz.warehouse;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseItemRepository extends JpaRepository<WarehouseItem, String> {
  List<WarehouseItem> findByMemberIdAndStatus(String memberId, String status);

  List<WarehouseItem> findByMemberId(String memberId);

  List<WarehouseItem> findByStatus(String status);

  List<WarehouseItem> findByIdIn(List<String> ids);
}
