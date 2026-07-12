package com.cardbeamz.group;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.IdGenerator;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupService {

  private final GroupRepository groupRepository;

  public Map<String, Object> list() {
    List<GroupEntity> groups = groupRepository.findAll();
    Map<String, Object> data = new HashMap<>();
    data.put("total", groups.size());
    data.put("groups", groups);
    return data;
  }

  @Transactional
  public Map<String, Object> create(String code, String name, String photo, int exchangeValue) {
    if (groupRepository.findByCode(code).isPresent()) {
      throw new ApiException("group", "create", "新增團", "4001", "團代號已存在");
    }
    GroupEntity group =
        GroupEntity.builder()
            .id(IdGenerator.next("GRP"))
            .code(code)
            .name(name)
            .photo(photo)
            .exchangeValue(exchangeValue)
            .createdAt(Instant.now())
            .build();
    groupRepository.save(group);
    return Map.of("group", group);
  }

  @Transactional
  public Map<String, Object> update(String id, String code, String name, String photo, Integer exchangeValue) {
    GroupEntity group =
        groupRepository
            .findById(id)
            .orElseThrow(() -> new ApiException("group", "update", "修改團", "4002", "團不存在"));
    if (code != null) group.setCode(code);
    if (name != null) group.setName(name);
    if (photo != null) group.setPhoto(photo);
    if (exchangeValue != null) group.setExchangeValue(exchangeValue);
    groupRepository.save(group);
    return Map.of("group", group);
  }

  @Transactional
  public Map<String, Object> delete(String id) {
    if (!groupRepository.existsById(id)) {
      throw new ApiException("group", "delete", "刪除團", "4002", "團不存在");
    }
    groupRepository.deleteById(id);
    return Map.of("id", id);
  }
}
