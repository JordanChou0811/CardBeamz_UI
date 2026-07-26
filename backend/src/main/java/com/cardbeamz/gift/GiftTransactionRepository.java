package com.cardbeamz.gift;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GiftTransactionRepository extends JpaRepository<GiftTransaction, String> {
  List<GiftTransaction> findByRecipientMemberIdOrderByCreatedAtDesc(String recipientMemberId);
}
