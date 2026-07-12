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

  @Column(nullable = false)
  private int exchangeValue;

  @Column(nullable = false)
  private Instant createdAt;
}
