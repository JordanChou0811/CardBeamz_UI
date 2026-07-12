package com.cardbeamz.credit;

import com.cardbeamz.common.ApiResponse;
import com.cardbeamz.member.Member;
import com.cardbeamz.member.MemberService;
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
@RequestMapping("/api/credit")
@RequiredArgsConstructor
public class CreditController {

  private final MemberService memberService;

  @GetMapping("/get-balance")
  public ApiResponse<Map<String, Object>> getBalance(@RequestParam String memberId) {
    Member m = memberService.require(memberId);
    return ApiResponse.ok(
        "credit",
        "get-balance",
        "餘額查詢",
        Map.of("memberId", m.getId(), "credit", m.getCredit()));
  }

  @PostMapping("/update")
  public ApiResponse<Map<String, Object>> update(@RequestBody UpdateRequest req) {
    if (req.getCredit() != null) {
      memberService.setCredit(req.getMemberId(), req.getCredit());
    } else if (req.getDelta() != null) {
      memberService.addCredit(req.getMemberId(), req.getDelta());
    }
    Member m = memberService.require(req.getMemberId());
    return ApiResponse.ok(
        "credit",
        "update",
        "餘額修改",
        Map.of("memberId", m.getId(), "credit", m.getCredit()));
  }

  @Data
  public static class UpdateRequest {
    private String memberId;
    private Integer credit;
    private Integer delta;
  }
}
