package com.cardbeamz.member;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, String> {
  Optional<Member> findByAccount(String account);
  boolean existsByAccount(String account);
}
