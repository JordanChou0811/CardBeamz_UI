package com.cardbeamz.group;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 團的卡片目錄（尚未分派給會員）。
 * 分派後會產生會員倉庫 {@code WarehouseItem}。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "group_cards")
public class GroupCard {

  @Id
  private String id;

  @Column(nullable = false)
  private String groupId;

  private String cardName;
  private String cardNo;

  @Column(nullable = false, length = 1000)
  private String photo;

  @Column(nullable = false)
  private int exchangeValue;

  @Column(nullable = false)
  private Instant createdAt;
}
