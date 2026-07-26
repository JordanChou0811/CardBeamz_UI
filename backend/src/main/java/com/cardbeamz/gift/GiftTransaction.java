package com.cardbeamz.gift;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 會員間贈與申請與處理紀錄。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "gift_transactions")
public class GiftTransaction {

  @Id private String id;

  @Column(nullable = false, length = 20)
  private String type;

  @Column(nullable = false)
  private String senderMemberId;

  @Column(nullable = false)
  private String recipientMemberId;

  private String warehouseItemId;

  private Integer creditAmount;

  @Column(nullable = false)
  private Instant createdAt;

  /** pending、accepted、rejected */
  @Column(length = 20)
  private String status;

  private Instant completedAt;
}
