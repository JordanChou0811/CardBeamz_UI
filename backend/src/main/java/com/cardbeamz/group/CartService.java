package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.member.Member;
import com.cardbeamz.member.MemberService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
  private final TeamSlotRepository teamSlotRepository;
  private final TeamSlotService teamSlotService;
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
      Map<String, Object> line;
      try {
        line = item.isTeamLine() ? buildTeamLine(g, item) : buildStakeLine(g, item.getQuantity());
      } catch (ApiException ex) {
        continue;
      }
      line.put("cartItemId", item.getId());
      lines.add(line);
      grand += (int) line.get("subtotal");
    }
    Map<String, Object> data = new HashMap<>();
    data.put("items", lines);
    data.put("grandSubtotal", grand);
    data.put("maxCreditUsable", Math.max(0, Math.min(member.getCredit(), grand)));
    return data;
  }

  /** 注數認購：更新數量 */
  @Transactional
  public Map<String, Object> upsert(String memberId, String groupId, int quantity) {
    memberService.require(memberId);
    GroupEntity group = groupService.require(groupId);
    if (!GroupEntity.STATUS_LISTED.equals(group.getStatus())) {
      throw new ApiException("cart", "upsert", "購物車", ReturnCodes.GROUP_NOT_LISTED, "團未上架");
    }
    if (!GroupEntity.isStakeSale(group.getType())) {
      throw new ApiException("cart", "upsert", "購物車", ReturnCodes.SYSTEM_VALIDATION, "此團請用買隊加入購物車");
    }
    int remaining = Math.max(0, group.getTotalStakes() - group.getSoldStakes());
    if (quantity < 1) {
      cartItemRepository.deleteByMemberIdAndGroupIdAndTeamSlotIdIsNull(memberId, groupId);
      return list(memberId);
    }
    if (quantity > remaining) {
      throw new ApiException(
          "cart", "upsert", "購物車", ReturnCodes.GROUP_STAKES_INSUFFICIENT, "剩餘注數不足");
    }
    CartItem item =
        cartItemRepository
            .findByMemberIdAndGroupIdAndTeamSlotIdIsNull(memberId, groupId)
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
    item.setTeamSlotId(null);
    item.setUpdatedAt(Instant.now());
    cartItemRepository.save(item);
    return list(memberId);
  }

  /** 買隊：加入／移除單一球隊槽位 */
  @Transactional
  public Map<String, Object> upsertTeam(String memberId, String teamSlotId, boolean add) {
    memberService.require(memberId);
    TeamSlot slot = teamSlotService.require(teamSlotId);
    GroupEntity group = groupService.require(slot.getGroupId());
    if (!GroupEntity.STATUS_LISTED.equals(group.getStatus())) {
      throw new ApiException("cart", "upsert-team", "購物車", ReturnCodes.GROUP_NOT_LISTED, "團未上架");
    }
    if (!GroupEntity.isTeamSale(group.getType())) {
      throw new ApiException("cart", "upsert-team", "購物車", ReturnCodes.SYSTEM_VALIDATION, "非買隊團");
    }
    if (!add) {
      cartItemRepository.deleteByMemberIdAndTeamSlotId(memberId, teamSlotId);
      return list(memberId);
    }
    if (!TeamSlot.STATUS_AVAILABLE.equals(slot.getStatus())) {
      throw new ApiException("cart", "upsert-team", "購物車", ReturnCodes.TEAM_SOLD, "該隊已售出");
    }
    if (slot.getPrice() < 1) {
      throw new ApiException("cart", "upsert-team", "購物車", ReturnCodes.SYSTEM_VALIDATION, "該隊尚未定價");
    }
    CartItem item =
        cartItemRepository
            .findByMemberIdAndTeamSlotId(memberId, teamSlotId)
            .orElseGet(
                () ->
                    CartItem.builder()
                        .id(IdGenerator.next("CART"))
                        .memberId(memberId)
                        .groupId(group.getId())
                        .teamSlotId(teamSlotId)
                        .quantity(1)
                        .updatedAt(Instant.now())
                        .build());
    item.setQuantity(1);
    item.setUpdatedAt(Instant.now());
    cartItemRepository.save(item);
    return list(memberId);
  }

  @Transactional
  public Map<String, Object> remove(String memberId, String groupId) {
    memberService.require(memberId);
    cartItemRepository.deleteByMemberIdAndGroupIdAndTeamSlotIdIsNull(memberId, groupId);
    return list(memberId);
  }

  @Transactional
  public Map<String, Object> removeTeam(String memberId, String teamSlotId) {
    memberService.require(memberId);
    cartItemRepository.deleteByMemberIdAndTeamSlotId(memberId, teamSlotId);
    return list(memberId);
  }

  @Transactional
  public Map<String, Object> checkout(String memberId, int creditToUse) {
    Member member = memberService.require(memberId);
    List<CartItem> items = cartItemRepository.findByMemberIdOrderByUpdatedAtDesc(memberId);
    if (items.isEmpty()) {
      throw new ApiException("cart", "checkout", "結帳", ReturnCodes.CART_EMPTY, "購物車是空的");
    }

    List<Map<String, Object>> previewLines = new ArrayList<>();
    List<CartItem> validItems = new ArrayList<>();
    int grand = 0;

    for (CartItem item : items) {
      GroupEntity g = groupService.require(item.getGroupId());
      if (!GroupEntity.STATUS_LISTED.equals(g.getStatus())) {
        throw new ApiException("cart", "checkout", "結帳", ReturnCodes.GROUP_NOT_LISTED, "團未上架：" + g.getCode());
      }
      Map<String, Object> line;
      if (item.isTeamLine()) {
        TeamSlot slot = teamSlotService.require(item.getTeamSlotId());
        if (!TeamSlot.STATUS_AVAILABLE.equals(slot.getStatus())) {
          throw new ApiException("cart", "checkout", "結帳", ReturnCodes.TEAM_SOLD, "該隊已售出：" + slot.getTeamCode());
        }
        line = buildTeamLine(g, item);
      } else {
        int remaining = g.getTotalStakes() - g.getSoldStakes();
        if (item.getQuantity() > remaining) {
          throw new ApiException(
              "cart", "checkout", "結帳", ReturnCodes.GROUP_STAKES_INSUFFICIENT, "剩餘注數不足：" + g.getCode());
        }
        line = buildStakeLine(g, item.getQuantity());
      }
      previewLines.add(line);
      validItems.add(item);
      grand += (int) line.get("subtotal");
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

    int creditLeft = credit;
    List<StakePurchase> stakeCreated = new ArrayList<>();
    Set<GroupEntity> touchedGroups = new LinkedHashSet<>();
    Instant now = Instant.now();

    for (int i = 0; i < validItems.size(); i++) {
      CartItem item = validItems.get(i);
      Map<String, Object> line = previewLines.get(i);
      int subtotal = (int) line.get("subtotal");
      int lineCredit;
      if (i == validItems.size() - 1) {
        lineCredit = creditLeft;
      } else {
        lineCredit = (int) Math.floor(credit * (subtotal / (double) grand));
        lineCredit = Math.min(lineCredit, creditLeft);
        creditLeft -= lineCredit;
      }
      int lineCash = subtotal - lineCredit;
      GroupEntity g = groupService.require(item.getGroupId());

      if (item.isTeamLine()) {
        TeamSlot slot = teamSlotService.requireAvailable(item.getTeamSlotId());
        slot.setStatus(TeamSlot.STATUS_SOLD);
        slot.setBuyerMemberId(memberId);
        slot.setPaidAmount(subtotal);
        slot.setCreditUsed(lineCredit);
        slot.setCashDue(lineCash);
        slot.setSoldAt(now);
        teamSlotRepository.save(slot);
        g.setSoldStakes((int) teamSlotRepository.countByGroupIdAndStatus(g.getId(), TeamSlot.STATUS_SOLD));
        touchedGroups.add(g);
      } else {
        int qty = item.getQuantity();
        int unitPrice = (int) line.get("unitPrice");
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
        stakeCreated.add(p);
        g.setSoldStakes(g.getSoldStakes() + qty);
        touchedGroups.add(g);
      }
    }

    if (credit > 0) {
      memberService.addCredit(memberId, -credit);
    }
    if (!stakeCreated.isEmpty()) {
      stakePurchaseRepository.saveAll(stakeCreated);
    }
    groupRepository.saveAll(touchedGroups);
    cartItemRepository.deleteAll(validItems);

    Map<String, Object> data = new HashMap<>();
    data.put("grandSubtotal", grand);
    data.put("creditUsed", credit);
    data.put("cashDue", cashDue);
    data.put("purchases", stakeCreated);
    return data;
  }

  private Map<String, Object> buildStakeLine(GroupEntity g, int quantity) {
    List<PriceTier> tiers = StakePricing.parseTiers(g.getPriceTiersJson());
    int unit = StakePricing.unitPrice(g.getBasePrice(), tiers, quantity);
    int subtotal = unit * quantity;
    Map<String, Object> line = new HashMap<>();
    line.put("kind", "stake");
    line.put("groupId", g.getId());
    line.put("groupCode", g.getCode());
    line.put("groupName", g.getName());
    line.put("groupPhoto", g.getPhoto());
    line.put("groupType", g.getType());
    line.put("quantity", quantity);
    line.put("unitPrice", unit);
    line.put("basePrice", g.getBasePrice());
    line.put("subtotal", subtotal);
    line.put("remainingStakes", Math.max(0, g.getTotalStakes() - g.getSoldStakes()));
    line.put("priceTiers", tiers);
    return line;
  }

  private Map<String, Object> buildTeamLine(GroupEntity g, CartItem item) {
    TeamSlot slot = teamSlotService.require(item.getTeamSlotId());
    Map<String, Object> line = new HashMap<>();
    line.put("kind", "team");
    line.put("groupId", g.getId());
    line.put("groupCode", g.getCode());
    line.put("groupName", g.getName());
    line.put("groupPhoto", g.getPhoto());
    line.put("groupType", g.getType());
    line.put("teamSlotId", slot.getId());
    line.put("teamCode", slot.getTeamCode());
    line.put("teamName", slot.getTeamName());
    line.put("quantity", 1);
    line.put("unitPrice", slot.getPrice());
    line.put("subtotal", slot.getPrice());
    return line;
  }
}
