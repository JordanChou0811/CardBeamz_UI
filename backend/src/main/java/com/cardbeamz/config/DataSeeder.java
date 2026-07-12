package com.cardbeamz.config;

import com.cardbeamz.group.GroupEntity;
import com.cardbeamz.group.GroupRepository;
import com.cardbeamz.member.Member;
import com.cardbeamz.member.MemberRepository;
import com.cardbeamz.member.MemberService;
import com.cardbeamz.news.NewsItem;
import com.cardbeamz.news.NewsRepository;
import com.cardbeamz.warehouse.WarehouseItem;
import com.cardbeamz.warehouse.WarehouseItemRepository;
import com.cardbeamz.common.IdGenerator;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

  private final MemberRepository memberRepository;
  private final WarehouseItemRepository itemRepository;
  private final GroupRepository groupRepository;
  private final NewsRepository newsRepository;
  private final MemberService memberService;
  private final PasswordEncoder passwordEncoder;

  @Override
  public void run(String... args) {
    if (memberRepository.count() > 0) {
      memberService.initSeqFromDb();
      return;
    }

    Instant now = Instant.now();

    Member admin =
        Member.builder()
            .id("CBZ0000000")
            .account("0900000000")
            .name("系統管理員")
            .password(passwordEncoder.encode("admin"))
            .credit(0)
            .role("admin")
            .createdAt(now)
            .build();

    Member demo =
        Member.builder()
            .id("CBZ0000001")
            .account("0912345678")
            .name("王小明")
            .password(passwordEncoder.encode("123456"))
            .credit(120)
            .role("member")
            .createdAt(now)
            .build();

    memberRepository.save(admin);
    memberRepository.save(demo);
    memberService.initSeqFromDb();

    String[] palette = {"#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"};
    int[] exchangeValues = {30, 50, 80, 100, 60, 40};

    for (int i = 0; i < 6; i++) {
      String code = "CBZ" + String.format("%02d", i + 1);
      groupRepository.save(
          GroupEntity.builder()
              .id(IdGenerator.next("GRP"))
              .code(code)
              .name(code + " 團")
              .photo(palette[i])
              .exchangeValue(exchangeValues[i])
              .createdAt(now)
              .build());

      itemRepository.save(
          WarehouseItem.builder()
              .id(IdGenerator.next("ITEM"))
              .memberId(demo.getId())
              .cbz(code + " 團")
              .groupPhoto(palette[i])
              .exchangeValue(exchangeValues[i])
              .status("in_warehouse")
              .updatedAt(now)
              .build());
    }

    newsRepository.save(
        NewsItem.builder()
            .id(IdGenerator.next("NEWS"))
            .title("歡迎使用 CardBeamz 卡牌倉儲服務")
            .content("我們提供卡牌寄倉、回收、換團拆金與代寄服務，立即加入會員體驗！")
            .category("service")
            .createdAt(now)
            .build());
    newsRepository.save(
        NewsItem.builder()
            .id(IdGenerator.next("NEWS"))
            .title("系統維護公告")
            .content("本系統將於每週日凌晨 02:00-04:00 進行例行維護，期間部分功能可能暫停。")
            .category("maintenance")
            .createdAt(now)
            .build());

    log.info("Seeded demo data. Admin 0900000000/admin , Member 0912345678/123456");
  }
}
