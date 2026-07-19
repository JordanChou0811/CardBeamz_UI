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
@RequestMapping("/api/group-team")
@RequiredArgsConstructor
public class GroupTeamController {

  private final TeamSlotService teamSlotService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list(@RequestParam String groupId) {
    return ApiResponse.ok("group-team", "list", "球隊槽位", teamSlotService.list(groupId));
  }

  @PostMapping("/update-prices")
  public ApiResponse<Map<String, Object>> updatePrices(@RequestBody UpdatePricesRequest req) {
    List<TeamSlotService.PriceUpdate> updates =
        req.getPrices() == null
            ? List.of()
            : req.getPrices().stream()
                .map(p -> new TeamSlotService.PriceUpdate(p.getTeamCode(), p.getPrice()))
                .toList();
    return ApiResponse.ok(
        "group-team",
        "update-prices",
        "更新球隊價格",
        teamSlotService.updatePrices(req.getGroupId(), updates));
  }

  @Data
  public static class UpdatePricesRequest {
    private String groupId;
    private List<PriceRow> prices;
  }

  @Data
  public static class PriceRow {
    private String teamCode;
    private Integer price;
  }
}
