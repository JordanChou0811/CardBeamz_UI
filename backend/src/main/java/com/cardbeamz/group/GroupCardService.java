package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 團卡片目錄服務。
 *
 * <p>錯誤碼：
 * <ul>
 *   <li>4002 團不存在</li>
 *   <li>4101 團卡片不存在</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class GroupCardService {

  private final GroupCardRepository cardRepository;
  private final GroupRepository groupRepository;

  public Map<String, Object> list(String groupId) {
    requireGroup(groupId);
    List<GroupCard> cards = cardRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
    Map<String, Object> data = new HashMap<>();
    data.put("total", cards.size());
    data.put("cards", cards);
    return data;
  }

  @Transactional
  public Map<String, Object> create(
      String groupId, String cardName, String cardNo, String photo, Integer exchangeValue) {
    GroupEntity group = requireGroup(groupId);
    GroupCard card =
        GroupCard.builder()
            .id(IdGenerator.next("GCARD"))
            .groupId(groupId)
            .cardName(blankToNull(cardName))
            .cardNo(blankToNull(cardNo))
            .photo(photo == null || photo.isBlank() ? group.getPhoto() : photo)
            .exchangeValue(exchangeValue == null ? 0 : Math.max(0, exchangeValue))
            .createdAt(Instant.now())
            .build();
    cardRepository.save(card);
    return Map.of("card", card);
  }

  /** 匯入前端已驗證的卡片清單；所有卡片預設沿用團封面。 */
  @Transactional
  public Map<String, Object> createBatch(String groupId, List<CardInput> inputs) {
    GroupEntity group = requireGroup(groupId);
    if (inputs == null || inputs.isEmpty()) {
      throw new ApiException("group-card", "create-batch", "批次匯入卡片", ReturnCodes.SYSTEM_VALIDATION, "沒有可匯入的卡片");
    }

    Set<String> keys = new HashSet<>();
    for (GroupCard card : cardRepository.findByGroupIdOrderByCreatedAtDesc(groupId)) {
      keys.add(cardKey(card.getCardName(), card.getCardNo()));
    }
    List<GroupCard> cards = new java.util.ArrayList<>();
    for (CardInput input : inputs) {
      String cardName = blankToNull(input.cardName());
      String cardNo = blankToNull(input.cardNo());
      if (cardName == null && cardNo == null) {
        throw new ApiException("group-card", "create-batch", "批次匯入卡片", ReturnCodes.SYSTEM_VALIDATION, "卡片名稱或卡號不可為空");
      }
      int exchangeValue = input.exchangeValue() == null ? 0 : input.exchangeValue();
      if (exchangeValue < 0) {
        throw new ApiException("group-card", "create-batch", "批次匯入卡片", ReturnCodes.SYSTEM_VALIDATION, "團拆金不可為負數");
      }
      String key = cardKey(cardName, cardNo);
      if (!keys.add(key)) {
        throw new ApiException("group-card", "create-batch", "批次匯入卡片", ReturnCodes.SYSTEM_VALIDATION, "匯入資料含有重複卡片");
      }
      cards.add(
          GroupCard.builder()
              .id(IdGenerator.next("GCARD"))
              .groupId(groupId)
              .cardName(cardName)
              .cardNo(cardNo)
              .photo(group.getPhoto())
              .exchangeValue(exchangeValue)
              .createdAt(Instant.now())
              .build());
    }
    cardRepository.saveAll(cards);
    return Map.of("cards", cards, "createdCount", cards.size());
  }

  /**
   * 買隊團固定名冊：依 NBA／MLB 自動建立 30 張團卡片（卡號＝隊碼、卡名＝中文隊名）。
   * 已存在同卡號則略過；圖可於團拆後再上傳覆蓋。
   */
  @Transactional
  public void ensureTeamCards(GroupEntity group) {
    if (!GroupEntity.isTeamSale(group.getType())) return;
    List<TeamCatalog.TeamDef> defs = TeamCatalog.forGroupType(group.getType());
    if (defs.isEmpty()) return;
    String placeholder =
        group.getPhoto() == null || group.getPhoto().isBlank() ? "#64748b" : group.getPhoto();
    Instant now = Instant.now();
    for (TeamCatalog.TeamDef d : defs) {
      if (cardRepository.findByGroupIdAndCardNo(group.getId(), d.code()).isPresent()) {
        continue;
      }
      cardRepository.save(
          GroupCard.builder()
              .id(IdGenerator.next("GCARD"))
              .groupId(group.getId())
              .cardName(d.nameZh())
              .cardNo(d.code())
              .photo(placeholder)
              .exchangeValue(0)
              .createdAt(now)
              .build());
    }
  }

  @Transactional
  public Map<String, Object> update(
      String id, String cardName, String cardNo, String photo, Integer exchangeValue) {
    GroupCard card = requireCard(id);
    if (cardName != null) card.setCardName(blankToNull(cardName));
    if (cardNo != null) card.setCardNo(blankToNull(cardNo));
    if (photo != null && !photo.isBlank()) card.setPhoto(photo);
    if (exchangeValue != null) card.setExchangeValue(Math.max(0, exchangeValue));
    cardRepository.save(card);
    return Map.of("card", card);
  }

  @Transactional
  public Map<String, Object> delete(String id) {
    if (!cardRepository.existsById(id)) {
      // 4101 團卡片不存在
      throw new ApiException("group-card", "delete", "刪除團卡片", ReturnCodes.GROUP_CARD_NOT_FOUND, "團卡片不存在");
    }
    cardRepository.deleteById(id);
    return Map.of("id", id);
  }

  public GroupCard requireCard(String id) {
    return cardRepository
        .findById(id)
        .orElseThrow(
            () ->
                new ApiException(
                    "group-card", "get", "團卡片", ReturnCodes.GROUP_CARD_NOT_FOUND, "團卡片不存在")); // 4101
  }

  private GroupEntity requireGroup(String groupId) {
    return groupRepository
        .findById(groupId)
        .orElseThrow(
            () ->
                new ApiException("group-card", "group", "團卡片", ReturnCodes.GROUP_NOT_FOUND, "團不存在")); // 4002
  }

  private static String blankToNull(String value) {
    if (value == null) return null;
    String t = value.trim();
    return t.isEmpty() ? null : t;
  }

  private static String cardKey(String cardName, String cardNo) {
    return (cardName == null ? "" : cardName.trim().toLowerCase())
        + "\u0000"
        + (cardNo == null ? "" : cardNo.trim().toLowerCase());
  }

  public record CardInput(String cardName, String cardNo, Integer exchangeValue) {}
}
