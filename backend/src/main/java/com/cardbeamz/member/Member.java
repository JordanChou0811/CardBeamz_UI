package com.cardbeamz.member;

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
@Table(name = "members")
public class Member {

  @Id
  private String id;

  @Column(nullable = false, unique = true, length = 20)
  private String account;

  @Column(nullable = false, length = 80)
  private String name;

  @Column(nullable = false)
  private String password;

  @Builder.Default
  @Column(nullable = false)
  private int credit = 0;

  @Column(nullable = false, length = 20)
  private String role;

  @Column(nullable = false)
  private Instant createdAt;
}
