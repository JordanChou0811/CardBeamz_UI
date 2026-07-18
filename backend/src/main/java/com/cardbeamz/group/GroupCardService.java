package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import com.cardbeamz.common.ReturnCodes;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            .exchangeValue(exchangeValue == null ? group.getExchangeValue() : Math.max(0, exchangeValue))
            .createdAt(Instant.now())
            .build();
    cardRepository.save(card);
    return Map.of("card", card);
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
}
