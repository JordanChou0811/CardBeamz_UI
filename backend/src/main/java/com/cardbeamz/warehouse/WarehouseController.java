package com.cardbeamz.warehouse;

import com.cardbeamz.common.ApiResponse;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warehouse")
@RequiredArgsConstructor
public class WarehouseController {

  private final WarehouseService warehouseService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list(
      @RequestParam(required = false) String memberId,
      @RequestParam(required = false) String status) {
    return ApiResponse.ok("warehouse", "list", "倉庫一覽", warehouseService.list(memberId, status));
  }

  @PostMapping("/recycle")
  public ApiResponse<Map<String, Object>> recycle(@RequestBody ItemRequest req) {
    return ApiResponse.ok("warehouse", "recycle", "回收", warehouseService.recycle(req.getItemId()));
  }

  @PostMapping("/exchange")
  public ApiResponse<Map<String, Object>> exchange(@RequestBody ItemRequest req) {
    return ApiResponse.ok("warehouse", "exchange", "換團拆金", warehouseService.exchange(req.getItemId()));
  }

  @PostMapping("/checkout")
  public ApiResponse<Map<String, Object>> checkout(@RequestBody CheckoutRequest req) {
    return ApiResponse.ok(
        "warehouse",
        "checkout",
        "結帳出貨申請",
        "已建立訂單",
        warehouseService.checkout(req.getMemberId(), req.getItemIds(), req.getShipping()));
  }

  /** 後台分派卡片（前端 items-admin 對應） */
  @PostMapping("/assign")
  public ApiResponse<List<WarehouseItem>> assign(@RequestBody AssignRequest req) {
    List<WarehouseItem> created;
    if (req.getGroupCardId() != null && !req.getGroupCardId().isBlank()) {
      created =
          warehouseService.assignFromCatalog(
              req.getMemberId(),
              req.getGroupCardId(),
              req.getQuantity() == null ? 1 : req.getQuantity());
    } else {
      created =
          warehouseService.assign(
              req.getMemberId(),
              req.getCbz(),
              req.getGroupPhoto(),
              req.getExchangeValue(),
              req.getCardName(),
              req.getCardNo(),
              req.getQuantity() == null ? 1 : req.getQuantity());
    }
    return ApiResponse.ok("warehouse", "assign", "分派卡片", created);
  }

  @PostMapping("/remove")
  public ApiResponse<Map<String, Object>> remove(@RequestBody ItemRequest req) {
    warehouseService.remove(req.getItemId());
    return ApiResponse.ok("warehouse", "remove", "刪除卡片", Map.of("itemId", req.getItemId()));
  }

  @Data
  public static class ItemRequest {
    private String itemId;
  }

  @Data
  public static class CheckoutRequest {
    private String memberId;
    private List<String> itemIds;
    private Map<String, String> shipping;
  }

  @Data
  public static class AssignRequest {
    private String memberId;
    /** 從團卡片目錄分派時使用；有值則忽略下方手動欄位 */
    private String groupCardId;
    private String cbz;
    private String groupPhoto;
    private int exchangeValue;
    private String cardName;
    private String cardNo;
    private Integer quantity;
  }
}
