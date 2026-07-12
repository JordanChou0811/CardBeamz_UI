package com.cardbeamz.group;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<GroupEntity, String> {
  Optional<GroupEntity> findByCode(String code);
}
