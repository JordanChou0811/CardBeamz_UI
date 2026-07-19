package com.cardbeamz.group;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 滿 minQty 注以上，每注單價為 unitPrice（整數元） */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceTier {
  private int minQty;
  private int unitPrice;
}
