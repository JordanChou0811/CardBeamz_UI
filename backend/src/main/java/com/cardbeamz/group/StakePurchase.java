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

/** 會員認購注數紀錄（結帳成立後） */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stake_purchases")
public class StakePurchase {

  public static final String STATUS_ACTIVE = "active";
  public static final String STATUS_REFUNDED = "refunded";

  @Id
  private String id;

  @Column(nullable = false)
  private String memberId;

  @Column(nullable = false)
  private String groupId;

  @Column(nullable = false)
  private int quantity;

  /** 下單當下鎖定的每注單價 */
  @Column(nullable = false)
  private int unitPrice;

  @Column(nullable = false)
  private int subtotal;

  @Column(nullable = false)
  private int creditUsed;

  @Column(nullable = false)
  private int cashDue;

  @Column(nullable = false, length = 20)
  private String status;

  @Column(nullable = false)
  private Instant createdAt;
}
