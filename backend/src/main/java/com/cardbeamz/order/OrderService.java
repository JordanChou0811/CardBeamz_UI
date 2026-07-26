package com.cardbeamz.order;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.warehouse.WarehouseItem;
import com.cardbeamz.warehouse.WarehouseItemRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

  private final OrderRepository orderRepository;
  private final WarehouseItemRepository itemRepository;

  @Transactional(readOnly = true)
  public Map<String, Object> listByStatus(String status, String memberId) {
    List<OrderEntity> orders =
        memberId == null || memberId.isBlank()
            ? orderRepository.findByStatusOrderByCreatedAtDesc(status)
            : orderRepository.findByMemberIdAndStatusOrderByCreatedAtDesc(memberId, status);
    List<Map<String, Object>> mapped = orders.stream().map(this::toFrontendOrder).toList();
    Map<String, Object> data = new HashMap<>();
    data.put("total", mapped.size());
    data.put("orders", mapped);
    return data;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listPage(String status, String memberId, int pageNum, int pageSize) {
    int safeSize = pageSize == 20 || pageSize == 50 ? pageSize : 10;
    int safePage = Math.max(1, pageNum);
    Page<OrderEntity> page =
        memberId == null || memberId.isBlank()
            ? orderRepository.findByStatus(
                status, PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")))
            : orderRepository.findByMemberIdAndStatus(
                memberId,
                status,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
    Map<String, Object> data = new HashMap<>();
    data.put("orders", page.getContent().stream().map(this::toFrontendOrder).toList());
    data.put("pageNum", safePage);
    data.put("pageSize", safeSize);
    data.put("totalCount", page.getTotalElements());
    data.put("totalPages", page.getTotalPages());
    return data;
  }

  @Transactional
  public Map<String, Object> ship(String orderId) {
    OrderEntity order =
        orderRepository
            .findById(orderId)
            .orElseThrow(() -> new ApiException("order", "ship", "出貨", ReturnCodes.ORDER_NOT_FOUND, "訂單不存在"));
    if (!"placed".equals(order.getStatus())) {
      throw new ApiException("order", "ship", "出貨", ReturnCodes.ORDER_CANNOT_SHIP, "訂單狀態不可出貨");
    }
    Instant now = Instant.now();
    order.setStatus("shipped");
    order.setShippedAt(now);
    orderRepository.save(order);

    List<WarehouseItem> items = itemRepository.findByIdIn(order.getItemIds());
    for (WarehouseItem item : items) {
      item.setStatus("shipped");
      item.setUpdatedAt(now);
    }
    itemRepository.saveAll(items);

    Map<String, Object> data = new HashMap<>();
    data.put("orderId", orderId);
    data.put("status", "shipped");
    data.put("shippedAt", now.toString());
    data.put("order", toFrontendOrder(order));
    return data;
  }

  /** 轉成前端 Order 形狀：id / items[] / shipping / total */
  private Map<String, Object> toFrontendOrder(OrderEntity order) {
    List<String> ids = order.getItemIds() == null ? List.of() : order.getItemIds();
    List<WarehouseItem> items =
        ids.isEmpty() ? List.of() : itemRepository.findByIdIn(new ArrayList<>(ids));

    Map<String, Object> shipping = new HashMap<>();
    shipping.put("method", order.getShippingMethod());
    shipping.put("cvsBrand", order.getCvsBrand());
    shipping.put("name", order.getShippingName());
    shipping.put("phone", order.getShippingPhone());
    shipping.put("storeName", order.getStoreName());
    shipping.put("storeAddress", order.getStoreAddress());
    shipping.put("address", order.getAddress());
    shipping.put("lineId", order.getLineId());
    shipping.put("lineName", order.getLineName());

    Map<String, Object> map = new HashMap<>();
    map.put("id", order.getId());
    map.put("memberId", order.getMemberId());
    map.put("items", items);
    map.put("shipping", shipping);
    map.put("total", order.getTotal());
    map.put("status", order.getStatus());
    map.put("createdAt", order.getCreatedAt() == null ? null : order.getCreatedAt().toString());
    map.put("shippedAt", order.getShippedAt() == null ? null : order.getShippedAt().toString());
    return map;
  }
}
