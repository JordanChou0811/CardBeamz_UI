package com.cardbeamz.group;

import com.cardbeamz.common.ApiResponse;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/group")
@RequiredArgsConstructor
public class GroupController {

  private final GroupService groupService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list() {
    return ApiResponse.ok("group", "list", "團拆列表", groupService.list());
  }

  @PostMapping("/create")
  public ApiResponse<Map<String, Object>> create(@RequestBody GroupRequest req) {
    return ApiResponse.ok(
        "group",
        "create",
        "新增團",
        "已建立",
        groupService.create(req.getCode(), req.getName(), req.getPhoto()));
  }

  @PostMapping("/update")
  public ApiResponse<Map<String, Object>> update(@RequestBody GroupRequest req) {
    return ApiResponse.ok(
        "group",
        "update",
        "修改團",
        groupService.update(req.getId(), req.getCode(), req.getName(), req.getPhoto()));
  }

  @PostMapping("/delete")
  public ApiResponse<Map<String, Object>> delete(@RequestBody IdRequest req) {
    return ApiResponse.ok("group", "delete", "刪除團", groupService.delete(req.getId()));
  }

  @Data
  public static class GroupRequest {
    private String id;
    private String code;
    private String name;
    private String photo;
  }

  @Data
  public static class IdRequest {
    private String id;
  }
}
