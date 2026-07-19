package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.member.MemberService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TeamSlotService {

  private final TeamSlotRepository teamSlotRepository;
  private final GroupRepository groupRepository;
  private final MemberService memberService;

  public Map<String, Object> list(String groupId) {
    GroupEntity group = requireGroup(groupId);
    List<Map<String, Object>> slots =
        teamSlotRepository.findByGroupIdOrderByTeamCodeAsc(groupId).stream().map(this::toView).toList();
    Map<String, Object> data = new HashMap<>();
    data.put("groupId", groupId);
    data.put("groupType", group.getType());
    data.put("slots", slots);
    data.put(
        "availableCount",
        teamSlotRepository.countByGroupIdAndStatus(groupId, TeamSlot.STATUS_AVAILABLE));
    data.put("soldCount", teamSlotRepository.countByGroupIdAndStatus(groupId, TeamSlot.STATUS_SOLD));
    return data;
  }

  /** 依玩法建立 30 隊槽位（已存在則略過） */
  @Transactional
  public void ensureSlots(GroupEntity group) {
    if (!GroupEntity.isTeamSale(group.getType())) return;
    if (teamSlotRepository.countByGroupId(group.getId()) > 0) return;
    List<TeamCatalog.TeamDef> defs = TeamCatalog.forGroupType(group.getType());
    List<TeamSlot> slots = new ArrayList<>();
    for (TeamCatalog.TeamDef d : defs) {
      slots.add(
          TeamSlot.builder()
              .id(IdGenerator.next("TSL"))
              .groupId(group.getId())
              .teamCode(d.code())
              .teamName(d.nameZh())
              .price(0)
              .status(TeamSlot.STATUS_AVAILABLE)
              .build());
    }
    teamSlotRepository.saveAll(slots);
    group.setTotalStakes(slots.size());
    group.setSoldStakes(0);
    groupRepository.save(group);
  }

  @Transactional
  public Map<String, Object> updatePrices(String groupId, List<PriceUpdate> updates) {
    GroupEntity group = requireGroup(groupId);
    if (!GroupEntity.isTeamSale(group.getType())) {
      throw new ApiException("group-team", "update-prices", "球隊定價", ReturnCodes.SYSTEM_VALIDATION, "非買隊玩法");
    }
    boolean listed = GroupEntity.STATUS_LISTED.equals(group.getStatus());
    int refundedTotal = 0;
    for (PriceUpdate u : updates) {
      if (u == null || u.teamCode() == null || u.price() == null) continue;
      TeamSlot slot =
          teamSlotRepository
              .findByGroupIdAndTeamCode(groupId, u.teamCode().trim().toUpperCase())
              .orElseThrow(
                  () ->
                      new ApiException(
                          "group-team", "update-prices", "球隊定價", ReturnCodes.TEAM_NOT_FOUND, "球隊不存在"));
      int newPrice = Math.max(0, u.price());
      if (listed) {
        if (newPrice > slot.getPrice()) {
          throw new ApiException(
              "group-team",
              "update-prices",
              "球隊定價",
              ReturnCodes.GROUP_PRICE_INCREASE_FORBIDDEN,
              "上架中只准降價：" + slot.getTeamCode());
        }
        if (TeamSlot.STATUS_SOLD.equals(slot.getStatus()) && newPrice < slot.getPaidAmount()) {
          int refund = slot.getPaidAmount() - newPrice;
          if (refund > 0 && slot.getBuyerMemberId() != null) {
            memberService.addCredit(slot.getBuyerMemberId(), refund);
            refundedTotal += refund;
            int cash = slot.getCashDue();
            int cred = slot.getCreditUsed();
            if (cash >= refund) {
              slot.setCashDue(cash - refund);
            } else {
              slot.setCashDue(0);
              slot.setCreditUsed(Math.max(0, cred - (refund - cash)));
            }
            slot.setPaidAmount(newPrice);
          }
        }
      }
      slot.setPrice(newPrice);
      teamSlotRepository.save(slot);
    }
    Map<String, Object> data = list(groupId);
    data.put("creditRefunded", refundedTotal);
    return data;
  }

  public TeamSlot requireAvailable(String slotId) {
    TeamSlot slot =
        teamSlotRepository
            .findById(slotId)
            .orElseThrow(
                () ->
                    new ApiException(
                        "group-team", "get", "球隊", ReturnCodes.TEAM_NOT_FOUND, "球隊槽位不存在"));
    if (!TeamSlot.STATUS_AVAILABLE.equals(slot.getStatus())) {
      throw new ApiException("group-team", "get", "球隊", ReturnCodes.TEAM_SOLD, "該隊已售出");
    }
    return slot;
  }

  public TeamSlot require(String slotId) {
    return teamSlotRepository
        .findById(slotId)
        .orElseThrow(
            () ->
                new ApiException("group-team", "get", "球隊", ReturnCodes.TEAM_NOT_FOUND, "球隊槽位不存在"));
  }

  @Transactional
  public void clearSalesAndRefund(String groupId) {
    List<TeamSlot> slots = teamSlotRepository.findByGroupIdOrderByTeamCodeAsc(groupId);
    for (TeamSlot s : slots) {
      if (TeamSlot.STATUS_SOLD.equals(s.getStatus()) && s.getCreditUsed() > 0 && s.getBuyerMemberId() != null) {
        memberService.addCredit(s.getBuyerMemberId(), s.getCreditUsed());
      }
      s.setStatus(TeamSlot.STATUS_AVAILABLE);
      s.setBuyerMemberId(null);
      s.setPaidAmount(0);
      s.setCreditUsed(0);
      s.setCashDue(0);
      s.setSoldAt(null);
    }
    teamSlotRepository.saveAll(slots);
  }

  public Map<String, Object> toView(TeamSlot s) {
    Map<String, Object> m = new HashMap<>();
    m.put("id", s.getId());
    m.put("groupId", s.getGroupId());
    m.put("teamCode", s.getTeamCode());
    m.put("teamName", s.getTeamName());
    m.put("price", s.getPrice());
    m.put("status", s.getStatus());
    m.put("buyerMemberId", s.getBuyerMemberId());
    m.put("paidAmount", s.getPaidAmount());
    return m;
  }

  private GroupEntity requireGroup(String groupId) {
    return groupRepository
        .findById(groupId)
        .orElseThrow(() -> new ApiException("group", "get", "團", ReturnCodes.GROUP_NOT_FOUND, "團不存在"));
  }

  public record PriceUpdate(String teamCode, Integer price) {}
}
