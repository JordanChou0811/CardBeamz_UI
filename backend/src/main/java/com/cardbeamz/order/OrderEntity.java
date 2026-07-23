package com.cardbeamz.order;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class OrderEntity {

  @Id
  private String id;

  @Column(nullable = false)
  private String memberId;

  @Builder.Default
  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "order_item_ids", joinColumns = @JoinColumn(name = "order_id"))
  @Column(name = "item_id")
  private List<String> itemIds = new ArrayList<>();

  @Column(nullable = false, length = 20)
  private String shippingMethod;

  private String cvsBrand;
  private String shippingName;
  private String shippingPhone;
  private String storeName;
  private String storeAddress;
  private String address;
  private String lineId;
  private String lineName;

  @Column(nullable = false)
  private int total;

  @Column(nullable = false, length = 20)
  private String status;

  @Column(nullable = false)
  private Instant createdAt;

  private Instant shippedAt;
}
