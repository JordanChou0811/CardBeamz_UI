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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cart_items")
public class CartItem {

  @Id
  private String id;

  @Column(nullable = false)
  private String memberId;

  @Column(nullable = false)
  private String groupId;

  /** 注數認購用；買隊固定 1 */
  @Column(nullable = false)
  private int quantity;

  /** 買隊槽位；注數認購為 null */
  private String teamSlotId;

  @Column(nullable = false)
  private Instant updatedAt;

  public boolean isTeamLine() {
    return teamSlotId != null && !teamSlotId.isBlank();
  }
}
