package com.cardbeamz.group;

import com.cardbeamz.common.ApiResponse;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

  @GetMapping("/list-page")
  public ApiResponse<Map<String, Object>> listPage(
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize) {
    return ApiResponse.ok("group", "list-page", "團拆分頁列表", groupService.listPage(pageNum, pageSize));
  }

  @GetMapping("/list-listed")
  public ApiResponse<Map<String, Object>> listListed() {
    return ApiResponse.ok("group", "list-listed", "上架中的團", groupService.listListed());
  }

  @PostMapping("/create")
  public ApiResponse<Map<String, Object>> create(@RequestBody GroupRequest req) {
    return ApiResponse.ok(
        "group",
        "create",
        "新增團",
        "已建立",
        groupService.create(req.getCode(), req.getName(), req.getPhoto(), req.getType()));
  }

  @PostMapping("/update")
  public ApiResponse<Map<String, Object>> update(@RequestBody GroupRequest req) {
    return ApiResponse.ok(
        "group",
        "update",
        "修改團",
        groupService.update(req.getId(), req.getCode(), req.getName(), req.getPhoto()));
  }

  @PostMapping("/update-sale")
  public ApiResponse<Map<String, Object>> updateSale(@RequestBody SaleRequest req) {
    return ApiResponse.ok(
        "group",
        "update-sale",
        "修改銷售設定",
        groupService.updateSale(
            req.getId(), req.getType(), req.getTotalStakes(), req.getBasePrice(), req.getPriceTiers()));
  }

  @PostMapping("/publish")
  public ApiResponse<Map<String, Object>> publish(@RequestBody IdRequest req) {
    return ApiResponse.ok("group", "publish", "上架", groupService.publish(req.getId()));
  }

  @PostMapping("/unlist")
  public ApiResponse<Map<String, Object>> unlist(@RequestBody IdRequest req) {
    return ApiResponse.ok("group", "unlist", "下架", groupService.unlist(req.getId()));
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
    private String type;
  }

  @Data
  public static class SaleRequest {
    private String id;
    private String type;
    private Integer totalStakes;
    private Integer basePrice;
    private List<PriceTier> priceTiers;
  }

  @Data
  public static class IdRequest {
    private String id;
  }
}
