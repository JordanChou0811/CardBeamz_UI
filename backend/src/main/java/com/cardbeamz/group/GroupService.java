package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.member.MemberService;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupService {

  private final GroupRepository groupRepository;
  private final GroupCardRepository groupCardRepository;
  private final StakePurchaseRepository stakePurchaseRepository;
  private final CartItemRepository cartItemRepository;
  private final MemberService memberService;

  public Map<String, Object> list() {
    List<GroupEntity> groups = groupRepository.findAll();
    Map<String, Object> data = new HashMap<>();
    data.put("total", groups.size());
    data.put("groups", groups.stream().map(this::toView).toList());
    return data;
  }

  /** 前台：僅上架中的團 */
  public Map<String, Object> listListed() {
    List<Map<String, Object>> groups =
        groupRepository.findAll().stream()
            .filter(g -> GroupEntity.STATUS_LISTED.equals(g.getStatus()))
            .map(this::toView)
            .toList();
    Map<String, Object> data = new HashMap<>();
    data.put("total", groups.size());
    data.put("groups", groups);
    return data;
  }

  @Transactional
  public Map<String, Object> create(String code, String name, String photo) {
    if (groupRepository.findByCode(code).isPresent()) {
      throw new ApiException("group", "create", "新增團", ReturnCodes.GROUP_CODE_EXISTS, "團代號已存在");
    }
    GroupEntity group =
        GroupEntity.builder()
            .id(IdGenerator.next("GRP"))
            .code(code)
            .name(name)
            .photo(photo)
            .type(GroupEntity.TYPE_STAKE_SALE)
            .status(GroupEntity.STATUS_DRAFT)
            .totalStakes(0)
            .basePrice(0)
            .soldStakes(0)
            .priceTiersJson("[]")
            .exchangeValue(0)
            .createdAt(Instant.now())
            .build();
    groupRepository.save(group);
    return Map.of("group", toView(group));
  }

  @Transactional
  public Map<String, Object> update(String id, String code, String name, String photo) {
    GroupEntity group = require(id);
    if (code != null) group.setCode(code);
    if (name != null) group.setName(name);
    if (photo != null) group.setPhoto(photo);
    groupRepository.save(group);
    return Map.of("group", toView(group));
  }

  /**
   * 修改銷售設定。
   *
   * <ul>
   *   <li>draft / unlisted：可改玩法、總注數、價格
   *   <li>listed：可降價（含多注單價）；差額一律退團拆金；不可漲價；不可改總注數／玩法
   * </ul>
   */
  @Transactional
  public Map<String, Object> updateSale(
      String id, String type, Integer totalStakes, Integer basePrice, List<PriceTier> tiers) {
    GroupEntity group = require(id);
    boolean listed = GroupEntity.STATUS_LISTED.equals(group.getStatus());

    if (listed) {
      if (type != null && !type.isBlank() && !type.trim().equals(group.getType())) {
        throw new ApiException(
            "group", "update-sale", "銷售設定", ReturnCodes.GROUP_LISTED_LOCKED, "上架中不可改玩法，請先下架");
      }
      if (totalStakes != null && totalStakes != group.getTotalStakes()) {
        throw new ApiException(
            "group", "update-sale", "銷售設定", ReturnCodes.GROUP_LISTED_LOCKED, "上架中不可改總注數，請先下架");
      }
    } else {
      if (type != null && !type.isBlank()) {
        group.setType(type.trim());
      }
      if (totalStakes != null) {
        if (totalStakes < 0) {
          throw new ApiException(
              "group", "update-sale", "銷售設定", ReturnCodes.SYSTEM_VALIDATION, "總注數不可為負");
        }
        group.setTotalStakes(totalStakes);
      }
    }

    int newBase = basePrice != null ? basePrice : group.getBasePrice();
    if (newBase < 0) {
      throw new ApiException("group", "update-sale", "銷售設定", ReturnCodes.SYSTEM_VALIDATION, "單價不可為負");
    }
    List<PriceTier> newTiers =
        tiers != null
            ? StakePricing.parseTiers(StakePricing.toJson(tiers))
            : StakePricing.parseTiers(group.getPriceTiersJson());

    if (listed) {
      assertNotPriceIncrease(group, newBase, newTiers);
      int refundedTotal = applyPriceDropAndRefund(group, newBase, newTiers);
      group.setBasePrice(newBase);
      group.setPriceTiersJson(StakePricing.toJson(newTiers));
      groupRepository.save(group);
      Map<String, Object> data = new HashMap<>();
      data.put("group", toView(group));
      data.put("creditRefunded", refundedTotal);
      return data;
    }

    group.setBasePrice(newBase);
    if (tiers != null) {
      group.setPriceTiersJson(StakePricing.toJson(newTiers));
    }
    groupRepository.save(group);
    return Map.of("group", toView(group));
  }

  /** 上架：需有卡片、注數與價格 */
  @Transactional
  public Map<String, Object> publish(String id) {
    GroupEntity group = require(id);
    if (GroupEntity.STATUS_LISTED.equals(group.getStatus())) {
      return Map.of("group", toView(group));
    }
    if (groupCardRepository.countByGroupId(id) < 1) {
      throw new ApiException("group", "publish", "上架", ReturnCodes.GROUP_CANNOT_LIST, "至少需要一張團卡片");
    }
    if (!GroupEntity.TYPE_STAKE_SALE.equals(group.getType())) {
      throw new ApiException("group", "publish", "上架", ReturnCodes.GROUP_CANNOT_LIST, "尚不支援此玩法上架");
    }
    if (group.getTotalStakes() < 1 || group.getBasePrice() < 1) {
      throw new ApiException("group", "publish", "上架", ReturnCodes.GROUP_CANNOT_LIST, "請設定總注數與一注金額");
    }
    if (group.getSoldStakes() != 0) {
      // 理論上下架時已清零；防守
      group.setSoldStakes(0);
    }
    group.setStatus(GroupEntity.STATUS_LISTED);
    groupRepository.save(group);
    return Map.of("group", toView(group));
  }

  /**
   * 下架：清空該團認購、退還團拆金、清除購物車該團項目，方可改價後再上架。
   */
  @Transactional
  public Map<String, Object> unlist(String id) {
    GroupEntity group = require(id);
    if (GroupEntity.STATUS_DRAFT.equals(group.getStatus())) {
      return Map.of("group", toView(group));
    }
    refundAndClearPurchases(group);
    cartItemRepository.deleteByGroupId(id);
    group.setSoldStakes(0);
    group.setStatus(GroupEntity.STATUS_UNLISTED);
    groupRepository.save(group);
    return Map.of("group", toView(group));
  }

  @Transactional
  public Map<String, Object> delete(String id) {
    GroupEntity group = require(id);
    if (GroupEntity.STATUS_LISTED.equals(group.getStatus())) {
      throw new ApiException("group", "delete", "刪除團", ReturnCodes.GROUP_LISTED_LOCKED, "請先下架再刪除");
    }
    refundAndClearPurchases(group);
    cartItemRepository.deleteByGroupId(id);
    groupCardRepository.deleteByGroupId(id);
    groupRepository.deleteById(id);
    return Map.of("id", id);
  }

  public GroupEntity require(String id) {
    return groupRepository
        .findById(id)
        .orElseThrow(() -> new ApiException("group", "get", "團", ReturnCodes.GROUP_NOT_FOUND, "團不存在"));
  }

  public Map<String, Object> toView(GroupEntity g) {
    List<PriceTier> tiers = StakePricing.parseTiers(g.getPriceTiersJson());
    Map<String, Object> m = new HashMap<>();
    m.put("id", g.getId());
    m.put("code", g.getCode());
    m.put("name", g.getName());
    m.put("photo", g.getPhoto());
    m.put("type", g.getType());
    m.put("status", g.getStatus());
    m.put("totalStakes", g.getTotalStakes());
    m.put("basePrice", g.getBasePrice());
    m.put("soldStakes", g.getSoldStakes());
    m.put("remainingStakes", Math.max(0, g.getTotalStakes() - g.getSoldStakes()));
    m.put("priceTiers", tiers);
    m.put("createdAt", g.getCreatedAt() == null ? null : g.getCreatedAt().toString());
    return m;
  }

  /** 上架中：任一注數的新單價不可高於舊單價 */
  private void assertNotPriceIncrease(GroupEntity group, int newBase, List<PriceTier> newTiers) {
    List<PriceTier> oldTiers = StakePricing.parseTiers(group.getPriceTiersJson());
    int oldBase = group.getBasePrice();
    int maxQ = Math.max(group.getTotalStakes(), 1);
    for (int q = 1; q <= maxQ; q++) {
      int oldU = StakePricing.unitPrice(oldBase, oldTiers, q);
      int newU = StakePricing.unitPrice(newBase, newTiers, q);
      if (newU > oldU) {
        throw new ApiException(
            "group",
            "update-sale",
            "銷售設定",
            ReturnCodes.GROUP_PRICE_INCREASE_FORBIDDEN,
            "上架中只准降價，不可漲價");
      }
    }
  }

  /**
   * 依新價表重算既有認購；差額一律退團拆金（含原付現金部分）。
   *
   * @return 本次退還團拆金總額
   */
  private int applyPriceDropAndRefund(GroupEntity group, int newBase, List<PriceTier> newTiers) {
    List<StakePurchase> active =
        stakePurchaseRepository.findByGroupIdAndStatus(group.getId(), StakePurchase.STATUS_ACTIVE);
    int refundedTotal = 0;
    for (StakePurchase p : active) {
      int newUnit = StakePricing.unitPrice(newBase, newTiers, p.getQuantity());
      int newSubtotal = newUnit * p.getQuantity();
      int oldSubtotal = p.getSubtotal();
      int refund = oldSubtotal - newSubtotal;
      if (refund <= 0) {
        // 同價：仍同步鎖定單價欄位
        p.setUnitPrice(newUnit);
        p.setSubtotal(newSubtotal);
        continue;
      }
      memberService.addCredit(p.getMemberId(), refund);
      refundedTotal += refund;
      p.setUnitPrice(newUnit);
      p.setSubtotal(newSubtotal);
      // 帳面：先扣現金份額再扣原團拆金折抵，使 creditUsed + cashDue = newSubtotal
      int cash = p.getCashDue();
      int cred = p.getCreditUsed();
      if (cash >= refund) {
        p.setCashDue(cash - refund);
      } else {
        p.setCashDue(0);
        p.setCreditUsed(Math.max(0, cred - (refund - cash)));
      }
    }
    if (!active.isEmpty()) {
      stakePurchaseRepository.saveAll(active);
    }
    return refundedTotal;
  }

  private void refundAndClearPurchases(GroupEntity group) {
    List<StakePurchase> active =
        stakePurchaseRepository.findByGroupIdAndStatus(group.getId(), StakePurchase.STATUS_ACTIVE);
    for (StakePurchase p : active) {
      if (p.getCreditUsed() > 0) {
        memberService.addCredit(p.getMemberId(), p.getCreditUsed());
      }
      p.setStatus(StakePurchase.STATUS_REFUNDED);
    }
    stakePurchaseRepository.saveAll(active);
  }
}
