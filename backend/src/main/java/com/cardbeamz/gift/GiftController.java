package com.cardbeamz.gift;

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
@RequestMapping("/api/gift")
@RequiredArgsConstructor
public class GiftController {

  private final GiftService giftService;

  @PostMapping("/card")
  public ApiResponse<Map<String, Object>> card(@RequestBody CardGiftRequest req) {
    return ApiResponse.ok(
        "gift",
        "card",
        "贈與卡片",
        giftService.giftCard(req.getSenderMemberId(), req.getRecipientAccount(), req.getItemId()));
  }

  @PostMapping("/credit")
  public ApiResponse<Map<String, Object>> credit(@RequestBody CreditGiftRequest req) {
    return ApiResponse.ok(
        "gift",
        "credit",
        "贈與團拆金",
        giftService.giftCredit(req.getSenderMemberId(), req.getRecipientAccount(), req.getAmount()));
  }

  @GetMapping("/list-received")
  public ApiResponse<Map<String, Object>> listReceived(@RequestParam String memberId) {
    return ApiResponse.ok("gift", "list-received", "收到的贈與", giftService.listReceived(memberId));
  }

  @PostMapping("/accept")
  public ApiResponse<Map<String, Object>> accept(@RequestBody GiftActionRequest req) {
    return ApiResponse.ok(
        "gift", "accept", "接受贈與", giftService.accept(req.getRecipientMemberId(), req.getGiftId()));
  }

  @PostMapping("/reject")
  public ApiResponse<Map<String, Object>> reject(@RequestBody GiftActionRequest req) {
    return ApiResponse.ok(
        "gift", "reject", "拒絕贈與", giftService.reject(req.getRecipientMemberId(), req.getGiftId()));
  }

  @Data
  public static class CardGiftRequest {
    private String senderMemberId;
    private String recipientAccount;
    private String itemId;
  }

  @Data
  public static class CreditGiftRequest {
    private String senderMemberId;
    private String recipientAccount;
    private Integer amount;
  }

  @Data
  public static class GiftActionRequest {
    private String recipientMemberId;
    private String giftId;
  }
}
