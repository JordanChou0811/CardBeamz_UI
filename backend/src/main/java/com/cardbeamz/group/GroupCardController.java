package com.cardbeamz.group;

import com.cardbeamz.common.ApiResponse;
import java.util.Map;
import java.util.List;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/group-card")
@RequiredArgsConstructor
public class GroupCardController {

  private final GroupCardService groupCardService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list(@RequestParam String groupId) {
    return ApiResponse.ok("group-card", "list", "團卡片列表", groupCardService.list(groupId));
  }

  @PostMapping("/create")
  public ApiResponse<Map<String, Object>> create(@RequestBody CreateRequest req) {
    return ApiResponse.ok(
        "group-card",
        "create",
        "新增團卡片",
        "已建立",
        groupCardService.create(
            req.getGroupId(), req.getCardName(), req.getCardNo(), req.getPhoto(), req.getExchangeValue()));
  }

  @PostMapping("/create-batch")
  public ApiResponse<Map<String, Object>> createBatch(@RequestBody BatchCreateRequest req) {
    return ApiResponse.ok(
        "group-card",
        "create-batch",
        "批次匯入卡片",
        "已匯入",
        groupCardService.createBatch(
            req.getGroupId(),
            (req.getCards() == null ? List.<BatchCardRequest>of() : req.getCards()).stream()
                .map(card -> new GroupCardService.CardInput(card.getCardName(), card.getCardNo(), card.getExchangeValue()))
                .toList()));
  }

  @PostMapping("/update")
  public ApiResponse<Map<String, Object>> update(@RequestBody UpdateRequest req) {
    return ApiResponse.ok(
        "group-card",
        "update",
        "修改團卡片",
        groupCardService.update(
            req.getId(), req.getCardName(), req.getCardNo(), req.getPhoto(), req.getExchangeValue()));
  }

  @PostMapping("/delete")
  public ApiResponse<Map<String, Object>> delete(@RequestBody IdRequest req) {
    return ApiResponse.ok("group-card", "delete", "刪除團卡片", groupCardService.delete(req.getId()));
  }

  @Data
  public static class CreateRequest {
    private String groupId;
    private String cardName;
    private String cardNo;
    private String photo;
    private Integer exchangeValue;
  }

  @Data
  public static class BatchCreateRequest {
    private String groupId;
    private List<BatchCardRequest> cards;
  }

  @Data
  public static class BatchCardRequest {
    private String cardName;
    private String cardNo;
    private Integer exchangeValue;
  }

  @Data
  public static class UpdateRequest {
    private String id;
    private String cardName;
    private String cardNo;
    private String photo;
    private Integer exchangeValue;
  }

  @Data
  public static class IdRequest {
    private String id;
  }
}
