package com.cardbeamz.order;

import com.cardbeamz.common.ApiResponse;
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
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {

  private final OrderService orderService;

  @GetMapping("/list-placed")
  public ApiResponse<Map<String, Object>> listPlaced(@RequestParam(required = false) String memberId) {
    return ApiResponse.ok("order", "list-placed", "已下單查詢", orderService.listByStatus("placed", memberId));
  }

  @GetMapping("/list-shipped")
  public ApiResponse<Map<String, Object>> listShipped(@RequestParam(required = false) String memberId) {
    return ApiResponse.ok("order", "list-shipped", "已寄出查詢", orderService.listByStatus("shipped", memberId));
  }

  @GetMapping("/list-page")
  public ApiResponse<Map<String, Object>> listPage(
      @RequestParam String status,
      @RequestParam(required = false) String memberId,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize) {
    return ApiResponse.ok(
        "order", "list-page", "寄送訂單查詢", orderService.listPage(status, memberId, pageNum, pageSize));
  }

  @PostMapping("/ship")
  public ApiResponse<Map<String, Object>> ship(@RequestBody ShipRequest req) {
    return ApiResponse.ok("order", "ship", "出貨", "已出貨", orderService.ship(req.getOrderId()));
  }

  @Data
  public static class ShipRequest {
    private String orderId;
  }
}
