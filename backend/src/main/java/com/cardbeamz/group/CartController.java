package com.cardbeamz.group;

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
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

  private final CartService cartService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list(@RequestParam String memberId) {
    return ApiResponse.ok("cart", "list", "購物車", cartService.list(memberId));
  }

  @PostMapping("/upsert")
  public ApiResponse<Map<String, Object>> upsert(@RequestBody UpsertRequest req) {
    return ApiResponse.ok(
        "cart",
        "upsert",
        "更新購物車",
        cartService.upsert(req.getMemberId(), req.getGroupId(), req.getQuantity() == null ? 1 : req.getQuantity()));
  }

  @PostMapping("/remove")
  public ApiResponse<Map<String, Object>> remove(@RequestBody RemoveRequest req) {
    return ApiResponse.ok(
        "cart", "remove", "移除購物車項目", cartService.remove(req.getMemberId(), req.getGroupId()));
  }

  @PostMapping("/checkout")
  public ApiResponse<Map<String, Object>> checkout(@RequestBody CheckoutRequest req) {
    return ApiResponse.ok(
        "cart",
        "checkout",
        "結帳",
        "已成立認購",
        cartService.checkout(req.getMemberId(), req.getCreditToUse() == null ? 0 : req.getCreditToUse()));
  }

  @Data
  public static class UpsertRequest {
    private String memberId;
    private String groupId;
    private Integer quantity;
  }

  @Data
  public static class RemoveRequest {
    private String memberId;
    private String groupId;
  }

  @Data
  public static class CheckoutRequest {
    private String memberId;
    private Integer creditToUse;
  }
}
