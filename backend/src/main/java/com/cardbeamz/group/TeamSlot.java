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

/** 買隊團的單一球隊槽位（一隊一人） */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "team_slots")
public class TeamSlot {

  public static final String STATUS_AVAILABLE = "available";
  public static final String STATUS_SOLD = "sold";

  @Id
  private String id;

  @Column(nullable = false)
  private String groupId;

  @Column(nullable = false, length = 10)
  private String teamCode;

  @Column(nullable = false, length = 40)
  private String teamName;

  /** 該隊售價（整數元） */
  @Builder.Default
  @Column(nullable = false)
  private int price = 0;

  @Builder.Default
  @Column(nullable = false, length = 20)
  private String status = STATUS_AVAILABLE;

  private String buyerMemberId;

  /** 結帳鎖定的實付小計（= 當下 price） */
  @Builder.Default
  @Column(nullable = false)
  private int paidAmount = 0;

  @Builder.Default
  @Column(nullable = false)
  private int creditUsed = 0;

  @Builder.Default
  @Column(nullable = false)
  private int cashDue = 0;

  private Instant soldAt;
}
