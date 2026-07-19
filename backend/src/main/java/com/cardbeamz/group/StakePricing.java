package com.cardbeamz.group;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class StakePricing {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private StakePricing() {}

  public static List<PriceTier> parseTiers(String json) {
    if (json == null || json.isBlank()) return List.of();
    try {
      List<PriceTier> list = MAPPER.readValue(json, new TypeReference<List<PriceTier>>() {});
      if (list == null) return List.of();
      List<PriceTier> cleaned = new ArrayList<>();
      for (PriceTier t : list) {
        if (t == null) continue;
        if (t.getMinQty() < 2 || t.getUnitPrice() < 0) continue;
        cleaned.add(new PriceTier(t.getMinQty(), t.getUnitPrice()));
      }
      cleaned.sort(Comparator.comparingInt(PriceTier::getMinQty));
      return cleaned;
    } catch (Exception e) {
      return List.of();
    }
  }

  public static String toJson(List<PriceTier> tiers) {
    try {
      return MAPPER.writeValueAsString(tiers == null ? List.of() : tiers);
    } catch (Exception e) {
      return "[]";
    }
  }

  /** 依購買注數取適用單價（最高符合門檻；否則 basePrice） */
  public static int unitPrice(int basePrice, List<PriceTier> tiers, int quantity) {
    int price = Math.max(0, basePrice);
    if (tiers == null || quantity <= 0) return price;
    for (PriceTier t : tiers) {
      if (quantity >= t.getMinQty()) {
        price = Math.max(0, t.getUnitPrice());
      }
    }
    return price;
  }

  public static int lineSubtotal(int basePrice, List<PriceTier> tiers, int quantity) {
    int q = Math.max(0, quantity);
    return unitPrice(basePrice, tiers, q) * q;
  }
}
