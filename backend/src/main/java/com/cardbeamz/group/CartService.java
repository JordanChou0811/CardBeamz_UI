package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.member.Member;
import com.cardbeamz.member.MemberService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {

  private final CartItemRepository cartItemRepository;
  private final GroupRepository groupRepository;
  private final GroupService groupService;
  private final StakePurchaseRepository stakePurchaseRepository;
  private final MemberService memberService;

  public Map<String, Object> list(String memberId) {
    Member member = memberService.require(memberId);
    List<CartItem> items = cartItemRepository.findByMemberIdOrderByUpdatedAtDesc(memberId);
    List<Map<String, Object>> lines = new ArrayList<>();
    int grand = 0;
    for (CartItem item : items) {
      GroupEntity g = groupRepository.findById(item.getGroupId()).orElse(null);
      if (g == null || !GroupEntity.STATUS_LISTED.equals(g.getStatus())) {
        continue;
      }
      Map<String, Object> line = buildLine(g, item.getQuantity());
      line.put("cartItemId", item.getId());
      lines.add(line);
      grand += (int) line.get("subtotal");
    }
    Map<String, Object> data = new HashMap<>();
    data.put("items", lines);
    data.put("grandSubtotal", grand);
    // 團拆金可折全部；上限為 min(餘額, 合計)
    data.put("maxCreditUsable", Math.max(0, Math.min(member.getCredit(), grand)));
    return data;
  }

  @Transactional
  public Map<String, Object> upsert(String memberId, String groupId, int quantity) {
    memberService.require(memberId);
    GroupEntity group = groupService.require(groupId);
    if (!GroupEntity.STATUS_LISTED.equals(group.getStatus())) {
      throw new ApiException("cart", "upsert", "購物車", ReturnCodes.GROUP_NOT_LISTED, "團未上架");
    }
    int remaining = Math.max(0, group.getTotalStakes() - group.getSoldStakes());
    // 同會員購物車其他列 + 本列不可超過剩餘；先只檢本列數量上限為 remaining
    if (quantity < 1) {
      cartItemRepository.deleteByMemberIdAndGroupId(memberId, groupId);
      return list(memberId);
    }
    if (quantity > remaining) {
      throw new ApiException(
          "cart", "upsert", "購物車", ReturnCodes.GROUP_STAKES_INSUFFICIENT, "剩餘注數不足");
    }
    CartItem item =
        cartItemRepository
            .findByMemberIdAndGroupId(memberId, groupId)
            .orElseGet(
                () ->
                    CartItem.builder()
                        .id(IdGenerator.next("CART"))
                        .memberId(memberId)
                        .groupId(groupId)
                        .quantity(0)
                        .updatedAt(Instant.now())
                        .build());
    item.setQuantity(quantity);
    item.setUpdatedAt(Instant.now());
    cartItemRepository.save(item);
    return list(memberId);
  }

  @Transactional
  public Map<String, Object> remove(String memberId, String groupId) {
    memberService.require(memberId);
    cartItemRepository.deleteByMemberIdAndGroupId(memberId, groupId);
    return list(memberId);
  }

  /**
   * 結帳：下單當下重算單價；團拆金折抵須為非負整數，可折抵全部（現金可為 0）。
   *
   * @param creditToUse 想用的團拆金（超過可用額會拒絕）
   */
  @Transactional
  public Map<String, Object> checkout(String memberId, int creditToUse) {
    Member member = memberService.require(memberId);
    List<CartItem> items = cartItemRepository.findByMemberIdOrderByUpdatedAtDesc(memberId);
    if (items.isEmpty()) {
      throw new ApiException("cart", "checkout", "結帳", ReturnCodes.CART_EMPTY, "購物車是空的");
    }

    List<Map<String, Object>> previewLines = new ArrayList<>();
    int grand = 0;
    List<GroupEntity> groups = new ArrayList<>();
    List<Integer> qtys = new ArrayList<>();

    for (CartItem item : items) {
      GroupEntity g = groupService.require(item.getGroupId());
      if (!GroupEntity.STATUS_LISTED.equals(g.getStatus())) {
        throw new ApiException("cart", "checkout", "結帳", ReturnCodes.GROUP_NOT_LISTED, "團未上架：" + g.getCode());
      }
      int remaining = g.getTotalStakes() - g.getSoldStakes();
      if (item.getQuantity() > remaining) {
        throw new ApiException(
            "cart", "checkout", "結帳", ReturnCodes.GROUP_STAKES_INSUFFICIENT, "剩餘注數不足：" + g.getCode());
      }
      Map<String, Object> line = buildLine(g, item.getQuantity());
      previewLines.add(line);
      grand += (int) line.get("subtotal");
      groups.add(g);
      qtys.add(item.getQuantity());
    }

    if (grand < 1) {
      throw new ApiException("cart", "checkout", "結帳", ReturnCodes.SYSTEM_VALIDATION, "結帳金額異常");
    }

    int maxCredit = Math.min(member.getCredit(), grand);
    int credit = Math.max(0, creditToUse);
    if (credit > maxCredit) {
      throw new ApiException(
          "cart",
          "checkout",
          "結帳",
          ReturnCodes.CART_CREDIT_INVALID,
          "團拆金折抵過多（不可超過餘額與合計）");
    }
    int cashDue = grand - credit;

    // 依行項目比例分攤 credit（最後一行吃尾差）
    int creditLeft = credit;
    List<StakePurchase> created = new ArrayList<>();
    Instant now = Instant.now();
    for (int i = 0; i < groups.size(); i++) {
      GroupEntity g = groups.get(i);
      int qty = qtys.get(i);
      int subtotal = (int) previewLines.get(i).get("subtotal");
      int unitPrice = (int) previewLines.get(i).get("unitPrice");
      int lineCredit;
      if (i == groups.size() - 1) {
        lineCredit = creditLeft;
      } else {
        lineCredit = (int) Math.floor(credit * (subtotal / (double) grand));
        lineCredit = Math.min(lineCredit, creditLeft);
        // 保證整單 cash >= 1：單行 credit 不可吃光整單以外的部分已在總額控制
        creditLeft -= lineCredit;
      }
      int lineCash = subtotal - lineCredit;

      StakePurchase p =
          StakePurchase.builder()
              .id(IdGenerator.next("STK"))
              .memberId(memberId)
              .groupId(g.getId())
              .quantity(qty)
              .unitPrice(unitPrice)
              .subtotal(subtotal)
              .creditUsed(lineCredit)
              .cashDue(lineCash)
              .status(StakePurchase.STATUS_ACTIVE)
              .createdAt(now)
              .build();
      created.add(p);
      g.setSoldStakes(g.getSoldStakes() + qty);
    }

    if (credit > 0) {
      memberService.addCredit(memberId, -credit);
    }
    stakePurchaseRepository.saveAll(created);
    groupRepository.saveAll(groups);
    cartItemRepository.deleteAll(items);

    Map<String, Object> data = new HashMap<>();
    data.put("grandSubtotal", grand);
    data.put("creditUsed", credit);
    data.put("cashDue", cashDue);
    data.put("purchases", created);
    return data;
  }

  private Map<String, Object> buildLine(GroupEntity g, int quantity) {
    List<PriceTier> tiers = StakePricing.parseTiers(g.getPriceTiersJson());
    int unit = StakePricing.unitPrice(g.getBasePrice(), tiers, quantity);
    int subtotal = unit * quantity;
    Map<String, Object> line = new HashMap<>();
    line.put("groupId", g.getId());
    line.put("groupCode", g.getCode());
    line.put("groupName", g.getName());
    line.put("groupPhoto", g.getPhoto());
    line.put("quantity", quantity);
    line.put("unitPrice", unit);
    line.put("basePrice", g.getBasePrice());
    line.put("subtotal", subtotal);
    line.put("remainingStakes", Math.max(0, g.getTotalStakes() - g.getSoldStakes()));
    line.put("priceTiers", tiers);
    return line;
  }
}
