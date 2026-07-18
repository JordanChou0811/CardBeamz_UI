package com.cardbeamz.group;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "cbz_groups")
public class GroupEntity {

  @Id
  private String id;

  @Column(nullable = false, unique = true, length = 20)
  private String code;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 1000)
  private String photo;

  /**
   * 舊欄位保留以相容既有 DB（NOT NULL）；業務上換團拆金改在卡片上。
   * 不對外回傳。
   */
  @JsonIgnore
  @Builder.Default
  @Column(nullable = false)
  private int exchangeValue = 0;

  @Column(nullable = false)
  private Instant createdAt;
}
