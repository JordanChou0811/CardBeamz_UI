package com.cardbeamz.member;

import com.cardbeamz.common.ApiResponse;
import jakarta.validation.constraints.NotBlank;
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
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController {

  private final MemberService memberService;

  @GetMapping("/list")
  public ApiResponse<Map<String, Object>> list() {
    return ApiResponse.ok("member", "list", "會員列表", memberService.list());
  }

  @GetMapping("/list-page")
  public ApiResponse<Map<String, Object>> listPage(
      @RequestParam(defaultValue = "1") int pageNum, @RequestParam(defaultValue = "10") int pageSize) {
    return ApiResponse.ok("member", "list-page", "會員列表", memberService.listPage(pageNum, pageSize));
  }

  @GetMapping("/me")
  public ApiResponse<Map<String, Object>> me(@RequestParam String memberId) {
    return ApiResponse.ok(
        "member",
        "me",
        "當前會員",
        Map.of("member", memberService.toPublic(memberService.require(memberId))));
  }

  @PostMapping("/login")
  public ApiResponse<Map<String, Object>> login(@RequestBody LoginRequest req) {
    return ApiResponse.ok("member", "login", "會員登入", "登入成功", memberService.login(req.getAccount(), req.getPassword()));
  }

  @PostMapping("/register")
  public ApiResponse<Map<String, Object>> register(@RequestBody RegisterRequest req) {
    return ApiResponse.ok(
        "member",
        "register",
        "申請會員",
        "註冊成功",
        memberService.register(req.getAccount(), req.getName(), req.getPassword(), req.getVerifyCode()));
  }

  @PostMapping("/send-verify-code")
  public ApiResponse<Map<String, Object>> sendVerifyCode(@RequestBody AccountRequest req) {
    return ApiResponse.ok(
        "member", "send-verify-code", "手機驗證", "驗證碼已發送", memberService.sendVerifyCode(req.getAccount()));
  }

  @PostMapping("/change-password")
  public ApiResponse<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest req) {
    return ApiResponse.ok(
        "member",
        "change-password",
        "更改密碼",
        "密碼已更新",
        memberService.changePassword(req.getMemberId(), req.getOldPassword(), req.getNewPassword()));
  }

  @PostMapping("/create")
  public ApiResponse<Map<String, Object>> create(@RequestBody AdminCreateRequest req) {
    return ApiResponse.ok(
        "member",
        "create",
        "新增會員",
        "已建立",
        memberService.adminCreate(req.getAccount(), req.getName(), req.getPassword(), req.getCredit()));
  }

  @PostMapping("/update")
  public ApiResponse<Map<String, Object>> update(@RequestBody AdminUpdateRequest req) {
    return ApiResponse.ok(
        "member",
        "update",
        "修改會員",
        "已更新",
        memberService.adminUpdate(
            req.getId(), req.getName(), req.getAccount(), req.getPassword(), req.getCredit()));
  }

  @Data
  public static class LoginRequest {
    @NotBlank private String account;
    @NotBlank private String password;
  }

  @Data
  public static class RegisterRequest {
    @NotBlank private String account;
    @NotBlank private String name;
    @NotBlank private String password;
    @NotBlank private String verifyCode;
  }

  @Data
  public static class AccountRequest {
    @NotBlank private String account;
  }

  @Data
  public static class ChangePasswordRequest {
    @NotBlank private String memberId;
    @NotBlank private String oldPassword;
    @NotBlank private String newPassword;
  }

  @Data
  public static class AdminCreateRequest {
    @NotBlank private String account;
    @NotBlank private String name;
    @NotBlank private String password;
    private Integer credit;
  }

  @Data
  public static class AdminUpdateRequest {
    @NotBlank private String id;
    private String name;
    private String account;
    private String password;
    private Integer credit;
  }
}
