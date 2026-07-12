package com.cardbeamz.notify;

import com.cardbeamz.common.ApiResponse;
import com.cardbeamz.member.MemberService;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 通知 API（目前為模擬成功回應）。 之後可接 Email / LINE Notify。
 */
@RestController
@RequestMapping("/api/notify")
@RequiredArgsConstructor
public class NotifyController {

  private final MemberService memberService;

  @PostMapping("/send")
  public ApiResponse<Map<String, Object>> send(@RequestBody SendRequest req) {
    memberService.require(req.getMemberId());
    Map<String, Object> data = new HashMap<>();
    data.put("memberId", req.getMemberId());
    data.put("channels", req.getChannels() == null ? List.of("email") : req.getChannels());
    data.put("subject", req.getSubject());
    data.put("sentAt", Instant.now().toString());
    return ApiResponse.ok("notify", "send", "發送通知（Email / LINE）", "通知已發送（模擬）", data);
  }

  @Data
  public static class SendRequest {
    private String memberId;
    private List<String> channels;
    private String subject;
    private String body;
  }
}
