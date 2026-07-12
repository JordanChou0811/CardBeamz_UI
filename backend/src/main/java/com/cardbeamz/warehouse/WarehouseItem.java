package com.cardbeamz.warehouse;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "warehouse_items")
public class WarehouseItem {

  @Id
  private String id;

  @Column(nullable = false)
  private String memberId;

  /** 團代號／名稱，對應前端 cbz */
  @Column(nullable = false)
  private String cbz;

  private String cardName;
  private String cardNo;

  @Column(nullable = false, length = 1000)
  private String groupPhoto;

  @Column(nullable = false)
  private int exchangeValue;

  @Column(nullable = false, length = 30)
  private String status;

  @Column(nullable = false)
  private Instant updatedAt;
}
