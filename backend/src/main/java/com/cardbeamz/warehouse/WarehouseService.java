package com.cardbeamz.warehouse;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.member.MemberService;
import com.cardbeamz.order.OrderEntity;
import com.cardbeamz.order.OrderRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 倉庫服務。錯誤碼 2xxx 見 {@link ReturnCodes}。 */
@Service
@RequiredArgsConstructor
public class WarehouseService {

  public static final Map<String, Integer> SHIPPING_FEE =
      Map.of("cvs", 60, "mail", 60, "pickup", 0);

  private final WarehouseItemRepository itemRepository;
  private final OrderRepository orderRepository;
  private final MemberService memberService;

  public Map<String, Object> list(String memberId, String status) {
    List<WarehouseItem> items;
    boolean hasMember = memberId != null && !memberId.isBlank();
    boolean hasStatus = status != null && !status.isBlank();
    if (hasMember && hasStatus) {
      items = itemRepository.findByMemberIdAndStatus(memberId, status);
    } else if (hasMember) {
      items = itemRepository.findByMemberId(memberId);
    } else if (hasStatus) {
      items = itemRepository.findByStatus(status);
    } else {
      items = itemRepository.findAll();
    }
    Map<String, Object> data = new HashMap<>();
    data.put("total", items.size());
    data.put("items", items);
    return data;
  }

  @Transactional
  public Map<String, Object> recycle(String itemId) {
    WarehouseItem item = requireInWarehouse(itemId);
    item.setStatus("recycled");
    item.setUpdatedAt(Instant.now());
    itemRepository.save(item);
    return Map.of("itemId", itemId, "status", "recycled");
  }

  @Transactional
  public Map<String, Object> exchange(String itemId) {
    WarehouseItem item = requireInWarehouse(itemId);
    item.setStatus("exchanged");
    item.setUpdatedAt(Instant.now());
    itemRepository.save(item);
    memberService.addCredit(item.getMemberId(), item.getExchangeValue());
    return Map.of(
        "itemId", itemId,
        "status", "exchanged",
        "creditAdded", item.getExchangeValue());
  }

  @Transactional
  public Map<String, Object> checkout(String memberId, List<String> itemIds, Map<String, String> shipping) {
    if (itemIds == null || itemIds.isEmpty()) {
      // 2001 未選擇卡片
      throw new ApiException("warehouse", "checkout", "結帳", ReturnCodes.WAREHOUSE_NO_ITEMS, "未選擇卡片");
    }
    memberService.require(memberId);
    List<WarehouseItem> items = itemRepository.findByIdIn(itemIds);
    if (items.size() != itemIds.size()) {
      // 2002 部分卡片不存在
      throw new ApiException("warehouse", "checkout", "結帳", ReturnCodes.WAREHOUSE_ITEM_MISSING, "部分卡片不存在");
    }
    for (WarehouseItem item : items) {
      if (!memberId.equals(item.getMemberId()) || !"in_warehouse".equals(item.getStatus())) {
        // 2003 卡片狀態不可結帳
        throw new ApiException("warehouse", "checkout", "結帳", ReturnCodes.WAREHOUSE_ITEM_NOT_READY, "卡片狀態不可結帳");
      }
    }

    String method = shipping.getOrDefault("method", "cvs");
    int fee = SHIPPING_FEE.getOrDefault(method, 60);
    Instant now = Instant.now();

    OrderEntity order =
        OrderEntity.builder()
            .id(IdGenerator.next("ORD"))
            .memberId(memberId)
            .itemIds(itemIds)
            .shippingMethod(method)
            .cvsBrand(shipping.get("cvsBrand"))
            .shippingName(shipping.get("name"))
            .shippingPhone(shipping.get("phone"))
            .storeName(shipping.get("storeName"))
            .storeAddress(shipping.get("storeAddress"))
            .address(shipping.get("address"))
            .lineId(shipping.get("lineId"))
            .lineName(shipping.get("lineName"))
            .total(fee)
            .status("placed")
            .createdAt(now)
            .build();
    orderRepository.save(order);

    for (WarehouseItem item : items) {
      item.setStatus("ordered");
      item.setUpdatedAt(now);
    }
    itemRepository.saveAll(items);

    Map<String, Object> data = new HashMap<>();
    data.put("orderId", order.getId());
    data.put("itemIds", itemIds);
    data.put("shippingMethod", method);
    data.put("shippingFee", fee);
    data.put("status", "placed");
    data.put("createdAt", now.toString());
    return data;
  }

  @Transactional
  public List<WarehouseItem> assign(
      String memberId,
      String cbz,
      String groupPhoto,
      int exchangeValue,
      String cardName,
      String cardNo,
      int quantity) {
    memberService.require(memberId);
    int count = Math.max(1, quantity);
    Instant now = Instant.now();
    List<WarehouseItem> created = new java.util.ArrayList<>();
    for (int i = 0; i < count; i++) {
      WarehouseItem item =
          WarehouseItem.builder()
              .id(IdGenerator.next("ITEM"))
              .memberId(memberId)
              .cbz(cbz)
              .cardName(cardName)
              .cardNo(cardNo)
              .groupPhoto(groupPhoto)
              .exchangeValue(exchangeValue)
              .status("in_warehouse")
              .updatedAt(now)
              .build();
      created.add(item);
    }
    return itemRepository.saveAll(created);
  }

  @Transactional
  public void remove(String itemId) {
    if (!itemRepository.existsById(itemId)) {
      // 2004 卡片不存在
      throw new ApiException("warehouse", "remove", "刪除卡片", ReturnCodes.WAREHOUSE_ITEM_NOT_FOUND, "卡片不存在");
    }
    itemRepository.deleteById(itemId);
  }

  private WarehouseItem requireInWarehouse(String itemId) {
    WarehouseItem item =
        itemRepository
            .findById(itemId)
            .orElseThrow(
                () ->
                    new ApiException(
                        "warehouse", "item", "倉庫", ReturnCodes.WAREHOUSE_ITEM_NOT_FOUND, "卡片不存在")); // 2004
    if (!"in_warehouse".equals(item.getStatus())) {
      // 2005 卡片不在倉庫中
      throw new ApiException("warehouse", "item", "倉庫", ReturnCodes.WAREHOUSE_ITEM_NOT_IN_STOCK, "卡片不在倉庫中");
    }
    return item;
  }
}
