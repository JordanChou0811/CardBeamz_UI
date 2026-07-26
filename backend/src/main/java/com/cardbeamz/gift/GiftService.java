package com.cardbeamz.gift;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.member.Member;
import com.cardbeamz.member.MemberRepository;
import com.cardbeamz.member.MemberService;
import com.cardbeamz.warehouse.WarehouseItem;
import com.cardbeamz.warehouse.WarehouseItemRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 會員間的卡片及團拆金贈與；須由受贈會員同意後才完成。 */
@Service
@RequiredArgsConstructor
public class GiftService {

  private final MemberService memberService;
  private final MemberRepository memberRepository;
  private final WarehouseItemRepository itemRepository;
  private final GiftTransactionRepository giftRepository;

  @Transactional
  public Map<String, Object> giftCard(String senderMemberId, String recipientAccount, String itemId) {
    Member sender = memberService.require(senderMemberId);
    Member recipient = requireRecipient(sender, recipientAccount);
    WarehouseItem item =
        itemRepository
            .findById(itemId)
            .orElseThrow(
                () ->
                    new ApiException(
                        "gift", "card", "贈與卡片", ReturnCodes.WAREHOUSE_ITEM_NOT_FOUND, "卡片不存在"));
    if (!sender.getId().equals(item.getMemberId()) || !"in_warehouse".equals(item.getStatus())) {
      throw new ApiException(
          "gift", "card", "贈與卡片", ReturnCodes.GIFT_CARD_UNAVAILABLE, "此卡片目前不可贈與");
    }

    Instant now = Instant.now();
    item.setStatus("gift_pending");
    item.setUpdatedAt(now);
    itemRepository.save(item);
    GiftTransaction transaction =
        giftRepository.save(
            GiftTransaction.builder()
                .id(IdGenerator.next("GIFT"))
                .type("card")
                .senderMemberId(sender.getId())
                .recipientMemberId(recipient.getId())
                .warehouseItemId(item.getId())
                .createdAt(now)
                .status("pending")
                .build());
    return Map.of(
        "giftId", transaction.getId(),
        "itemId", item.getId(),
        "recipientMemberId", recipient.getId(),
        "status", transaction.getStatus(),
        "createdAt", now.toString());
  }

  @Transactional
  public Map<String, Object> giftCredit(String senderMemberId, String recipientAccount, Integer amount) {
    Member sender = memberService.require(senderMemberId);
    Member recipient = requireRecipient(sender, recipientAccount);
    int creditAmount = amount == null ? 0 : amount;
    if (creditAmount <= 0 || creditAmount > sender.getCredit()) {
      throw new ApiException(
          "gift", "credit", "贈與團拆金", ReturnCodes.GIFT_CREDIT_INVALID, "贈與金額不可超過目前餘額");
    }

    Instant now = Instant.now();
    sender.setCredit(sender.getCredit() - creditAmount);
    // 先保留送出者的額度，避免等待受贈者回覆期間被其他操作花掉。
    memberRepository.save(sender);
    GiftTransaction transaction =
        giftRepository.save(
            GiftTransaction.builder()
                .id(IdGenerator.next("GIFT"))
                .type("credit")
                .senderMemberId(sender.getId())
                .recipientMemberId(recipient.getId())
                .creditAmount(creditAmount)
                .createdAt(now)
                .status("pending")
                .build());
    return Map.of(
        "giftId", transaction.getId(),
        "amount", creditAmount,
        "recipientMemberId", recipient.getId(),
        "senderCredit", sender.getCredit(),
        "status", transaction.getStatus(),
        "createdAt", now.toString());
  }

  public Map<String, Object> listReceived(String recipientMemberId) {
    memberService.require(recipientMemberId);
    List<GiftTransaction> transactions =
        giftRepository.findByRecipientMemberIdOrderByCreatedAtDesc(recipientMemberId);
    return Map.of("transactions", transactions);
  }

  @Transactional
  public Map<String, Object> accept(String recipientMemberId, String giftId) {
    GiftTransaction transaction = requirePendingForRecipient(recipientMemberId, giftId);
    Member recipient = memberService.require(recipientMemberId);
    Instant now = Instant.now();
    if ("card".equals(transaction.getType())) {
      WarehouseItem item =
          itemRepository
              .findById(transaction.getWarehouseItemId())
              .orElseThrow(
                  () ->
                      new ApiException(
                          "gift", "accept", "接受贈與", ReturnCodes.WAREHOUSE_ITEM_NOT_FOUND, "卡片不存在"));
      if (!transaction.getSenderMemberId().equals(item.getMemberId())
          || !"gift_pending".equals(item.getStatus())) {
        throw new ApiException(
            "gift", "accept", "接受贈與", ReturnCodes.GIFT_CARD_UNAVAILABLE, "此卡片目前不可接受");
      }
      item.setMemberId(recipient.getId());
      item.setStatus("in_warehouse");
      item.setUpdatedAt(now);
      itemRepository.save(item);
    } else if ("credit".equals(transaction.getType())) {
      recipient.setCredit(recipient.getCredit() + transaction.getCreditAmount());
      memberRepository.save(recipient);
    } else {
      throw new ApiException("gift", "accept", "接受贈與", ReturnCodes.SYSTEM_VALIDATION, "贈與類型錯誤");
    }
    transaction.setStatus("accepted");
    transaction.setCompletedAt(now);
    giftRepository.save(transaction);
    return Map.of("giftId", transaction.getId(), "status", transaction.getStatus(), "completedAt", now.toString());
  }

  @Transactional
  public Map<String, Object> reject(String recipientMemberId, String giftId) {
    GiftTransaction transaction = requirePendingForRecipient(recipientMemberId, giftId);
    Instant now = Instant.now();
    if ("card".equals(transaction.getType())) {
      WarehouseItem item =
          itemRepository
              .findById(transaction.getWarehouseItemId())
              .orElseThrow(
                  () ->
                      new ApiException(
                          "gift", "reject", "拒絕贈與", ReturnCodes.WAREHOUSE_ITEM_NOT_FOUND, "卡片不存在"));
      if (transaction.getSenderMemberId().equals(item.getMemberId()) && "gift_pending".equals(item.getStatus())) {
        item.setStatus("in_warehouse");
        item.setUpdatedAt(now);
        itemRepository.save(item);
      }
    } else if ("credit".equals(transaction.getType())) {
      Member sender = memberService.require(transaction.getSenderMemberId());
      sender.setCredit(sender.getCredit() + transaction.getCreditAmount());
      memberRepository.save(sender);
    }
    transaction.setStatus("rejected");
    transaction.setCompletedAt(now);
    giftRepository.save(transaction);
    return Map.of("giftId", transaction.getId(), "status", transaction.getStatus(), "completedAt", now.toString());
  }

  private GiftTransaction requirePendingForRecipient(String recipientMemberId, String giftId) {
    GiftTransaction transaction =
        giftRepository
            .findById(giftId)
            .orElseThrow(
                () ->
                    new ApiException(
                        "gift", "get", "贈與", ReturnCodes.GIFT_NOT_FOUND, "贈與紀錄不存在"));
    if (!recipientMemberId.equals(transaction.getRecipientMemberId())) {
      throw new ApiException(
          "gift", "get", "贈與", ReturnCodes.GIFT_RECIPIENT_FORBIDDEN, "不可處理此贈與");
    }
    if (!"pending".equals(transaction.getStatus())) {
      throw new ApiException(
          "gift", "get", "贈與", ReturnCodes.GIFT_NOT_PENDING, "此贈與已處理");
    }
    return transaction;
  }

  private Member requireRecipient(Member sender, String recipientAccount) {
    if (recipientAccount == null || !recipientAccount.matches("09\\d{8}")) {
      throw new ApiException(
          "gift", "recipient", "贈與", ReturnCodes.MEMBER_ACCOUNT_FORMAT, "請輸入完整手機號碼");
    }
    Member recipient =
        memberRepository
            .findByAccount(recipientAccount)
            .orElseThrow(
                () ->
                    new ApiException(
                        "gift", "recipient", "贈與", ReturnCodes.MEMBER_NOT_FOUND, "查無此會員電話號碼"));
    if (sender.getId().equals(recipient.getId())) {
      throw new ApiException(
          "gift", "recipient", "贈與", ReturnCodes.GIFT_SELF_FORBIDDEN, "不可贈與給自己");
    }
    return recipient;
  }
}
