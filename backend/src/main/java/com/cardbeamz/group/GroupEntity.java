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

  public static final String TYPE_STAKE_SALE = "stake_sale";
  /** 籃球買隊團（NBA 30） */
  public static final String TYPE_BBALL_TEAM = "bball_team";
  /** 棒球買隊團（MLB 30） */
  public static final String TYPE_BASEBALL_TEAM = "baseball_team";

  public static final String STATUS_DRAFT = "draft";
  public static final String STATUS_LISTED = "listed";
  public static final String STATUS_UNLISTED = "unlisted";

  public static boolean isTeamSale(String type) {
    return TYPE_BBALL_TEAM.equals(type) || TYPE_BASEBALL_TEAM.equals(type);
  }

  public static boolean isStakeSale(String type) {
    return TYPE_STAKE_SALE.equals(type);
  }

  @Id
  private String id;

  @Column(nullable = false, unique = true, length = 20)
  private String code;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 1000)
  private String photo;

  /** 玩法：stake_sale（注數認購）等 */
  @Builder.Default
  @Column(nullable = false, length = 40)
  private String type = TYPE_STAKE_SALE;

  /** draft | listed | unlisted */
  @Builder.Default
  @Column(nullable = false, length = 20)
  private String status = STATUS_DRAFT;

  /** 總注數（stake_sale） */
  @Builder.Default
  @Column(nullable = false)
  private int totalStakes = 0;

  /** 一注原價（整數元） */
  @Builder.Default
  @Column(nullable = false)
  private int basePrice = 0;

  /** 已售注數 */
  @Builder.Default
  @Column(nullable = false)
  private int soldStakes = 0;

  /** JSON：[{ "minQty": 5, "unitPrice": 270 }, ...] */
  @Builder.Default
  @Column(nullable = false, length = 2000)
  private String priceTiersJson = "[]";

  /**
   * 舊欄位保留以相容既有 DB；業務上換團拆金改在卡片上。
   */
  @JsonIgnore
  @Builder.Default
  @Column(nullable = false)
  private int exchangeValue = 0;

  @Column(nullable = false)
  private Instant createdAt;
}
