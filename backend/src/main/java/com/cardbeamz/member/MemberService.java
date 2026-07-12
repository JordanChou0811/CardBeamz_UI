package com.cardbeamz.member;

import com.cardbeamz.common.ApiException;
import com.cardbeamz.common.ReturnCodes;
import com.cardbeamz.common.IdGenerator;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 會員服務。
 *
 * <p>錯誤碼（returnCode）定義見 {@link com.cardbeamz.common.ReturnCodes}：
 * <ul>
 *   <li>1001 登入失敗</li>
 *   <li>1002 驗證碼錯誤</li>
 *   <li>1003 帳號已存在</li>
 *   <li>1004 會員不存在</li>
 *   <li>1005 舊密碼錯誤</li>
 *   <li>1006 帳號格式錯誤</li>
 *   <li>1007 不可修改管理員</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class MemberService {

  private final MemberRepository memberRepository;
  private final PasswordEncoder passwordEncoder;
  private final AtomicInteger memberSeq = new AtomicInteger(0);
  private final Map<String, String> verifyCodes = new ConcurrentHashMap<>();

  public synchronized void initSeqFromDb() {
    memberRepository.findAll().stream()
        .map(Member::getId)
        .filter(id -> id != null && id.startsWith("CBZ"))
        .map(id -> id.substring(3))
        .filter(s -> s.matches("\\d+"))
        .mapToInt(Integer::parseInt)
        .max()
        .ifPresent(memberSeq::set);
  }

  private String nextMemberId() {
    return "CBZ" + String.format("%07d", memberSeq.incrementAndGet());
  }

  public Map<String, Object> list() {
    List<Map<String, Object>> members =
        memberRepository.findAll().stream().map(this::toPublic).toList();
    Map<String, Object> data = new HashMap<>();
    data.put("total", members.size());
    data.put("members", members);
    return data;
  }

  public Map<String, Object> login(String account, String password) {
    Member member =
        memberRepository
            .findByAccount(account)
            .orElseThrow(() -> new ApiException("member", "login", "會員登入", ReturnCodes.MEMBER_LOGIN_FAILED, "帳號或密碼錯誤"));
    if (!passwordEncoder.matches(password, member.getPassword())) {
      throw new ApiException("member", "login", "會員登入", ReturnCodes.MEMBER_LOGIN_FAILED, "帳號或密碼錯誤");
    }
    Map<String, Object> data = new HashMap<>();
    data.put("token", IdGenerator.uuidToken());
    data.put("member", toPublic(member));
    return data;
  }

  @Transactional
  public Map<String, Object> register(String account, String name, String password, String verifyCode) {
    String expected = verifyCodes.get(account);
    if (expected == null || !expected.equals(verifyCode)) {
      throw new ApiException("member", "register", "申請會員", ReturnCodes.MEMBER_VERIFY_INVALID, "驗證碼錯誤或已過期");
    }
    if (memberRepository.existsByAccount(account)) {
      throw new ApiException("member", "register", "申請會員", ReturnCodes.MEMBER_ACCOUNT_EXISTS, "帳號已存在");
    }
    Member member =
        Member.builder()
            .id(nextMemberId())
            .account(account)
            .name(name)
            .password(passwordEncoder.encode(password))
            .credit(0)
            .role("member")
            .createdAt(Instant.now())
            .build();
    memberRepository.save(member);
    verifyCodes.remove(account);
    Map<String, Object> data = new HashMap<>();
    data.put("member", toPublic(member));
    return data;
  }

  public Map<String, Object> sendVerifyCode(String account) {
    String code = String.valueOf(100000 + (int) (Math.random() * 900000));
    verifyCodes.put(account, code);
    Map<String, Object> data = new HashMap<>();
    data.put("account", account);
    // 開發階段直接回傳驗證碼；之後改為簡訊／Email
    data.put("debugCode", code);
    data.put("expiresInSeconds", 300);
    return data;
  }

  @Transactional
  public Map<String, Object> changePassword(String memberId, String oldPassword, String newPassword) {
    Member member =
        memberRepository
            .findById(memberId)
            .orElseThrow(() -> new ApiException("member", "change-password", "更改密碼", ReturnCodes.MEMBER_NOT_FOUND, "會員不存在"));
    if (!passwordEncoder.matches(oldPassword, member.getPassword())) {
      throw new ApiException("member", "change-password", "更改密碼", ReturnCodes.MEMBER_OLD_PASSWORD_WRONG, "舊密碼錯誤");
    }
    member.setPassword(passwordEncoder.encode(newPassword));
    memberRepository.save(member);
    return Map.of("memberId", memberId);
  }

  public Member require(String memberId) {
    return memberRepository
        .findById(memberId)
        .orElseThrow(() -> new ApiException("member", "get", "會員查詢", ReturnCodes.MEMBER_NOT_FOUND, "會員不存在"));
  }

  public Map<String, Object> toPublic(Member m) {
    Map<String, Object> map = new HashMap<>();
    map.put("id", m.getId());
    map.put("account", m.getAccount());
    map.put("name", m.getName());
    map.put("credit", m.getCredit());
    map.put("role", m.getRole());
    map.put("createdAt", m.getCreatedAt().toString());
    return map;
  }

  @Transactional
  public void addCredit(String memberId, int amount) {
    Member m = require(memberId);
    m.setCredit(m.getCredit() + amount);
    memberRepository.save(m);
  }

  @Transactional
  public void setCredit(String memberId, int credit) {
    Member m = require(memberId);
    m.setCredit(credit);
    memberRepository.save(m);
  }

  /** 後台新增會員（略過驗證碼） */
  @Transactional
  public Map<String, Object> adminCreate(String account, String name, String password, Integer credit) {
    if (memberRepository.existsByAccount(account)) {
      throw new ApiException("member", "create", "新增會員", ReturnCodes.MEMBER_ACCOUNT_EXISTS, "帳號已存在");
    }
    if (account == null || !account.matches("09\\d{8}")) {
      throw new ApiException("member", "create", "新增會員", ReturnCodes.MEMBER_ACCOUNT_FORMAT, "帳號須為 09 開頭共 10 碼");
    }
    Member member =
        Member.builder()
            .id(nextMemberId())
            .account(account)
            .name(name)
            .password(passwordEncoder.encode(password))
            .credit(credit == null ? 0 : Math.max(0, credit))
            .role("member")
            .createdAt(Instant.now())
            .build();
    memberRepository.save(member);
    return Map.of("member", toPublic(member));
  }

  /** 後台修改會員資料 */
  @Transactional
  public Map<String, Object> adminUpdate(
      String id, String name, String account, String password, Integer credit) {
    Member member = require(id);
    if ("admin".equals(member.getRole())) {
      throw new ApiException("member", "update", "修改會員", ReturnCodes.MEMBER_ADMIN_FORBIDDEN, "不可由此修改管理員");
    }
    if (account != null && !account.isBlank() && !account.equals(member.getAccount())) {
      if (!account.matches("09\\d{8}")) {
        throw new ApiException("member", "update", "修改會員", ReturnCodes.MEMBER_ACCOUNT_FORMAT, "帳號須為 09 開頭共 10 碼");
      }
      if (memberRepository.existsByAccount(account)) {
        throw new ApiException("member", "update", "修改會員", ReturnCodes.MEMBER_ACCOUNT_EXISTS, "帳號已存在");
      }
      member.setAccount(account);
    }
    if (name != null && !name.isBlank()) {
      member.setName(name);
    }
    if (password != null && !password.isBlank()) {
      member.setPassword(passwordEncoder.encode(password));
    }
    if (credit != null) {
      member.setCredit(Math.max(0, credit));
    }
    memberRepository.save(member);
    return Map.of("member", toPublic(member));
  }
}
