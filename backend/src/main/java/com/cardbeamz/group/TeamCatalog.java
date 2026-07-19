package com.cardbeamz.group;

import java.util.List;

/** 買隊團預設名冊（NBA 30／MLB 30） */
public final class TeamCatalog {

  public record TeamDef(String code, String nameZh) {}

  private TeamCatalog() {}

  public static List<TeamDef> forGroupType(String type) {
    if (GroupEntity.TYPE_BBALL_TEAM.equals(type)) return NBA;
    if (GroupEntity.TYPE_BASEBALL_TEAM.equals(type)) return MLB;
    return List.of();
  }

  public static final List<TeamDef> NBA =
      List.of(
          new TeamDef("ATL", "老鷹"),
          new TeamDef("BOS", "塞爾提克"),
          new TeamDef("BKN", "籃網"),
          new TeamDef("CHA", "黃蜂"),
          new TeamDef("CHI", "公牛"),
          new TeamDef("CLE", "騎士"),
          new TeamDef("DAL", "小牛"),
          new TeamDef("DEN", "金塊"),
          new TeamDef("DET", "活塞"),
          new TeamDef("GSW", "勇士"),
          new TeamDef("HOU", "火箭"),
          new TeamDef("IND", "溜馬"),
          new TeamDef("LAC", "快艇"),
          new TeamDef("LAL", "湖人"),
          new TeamDef("MEM", "灰熊"),
          new TeamDef("MIA", "熱火"),
          new TeamDef("MIL", "公鹿"),
          new TeamDef("MIN", "灰狼"),
          new TeamDef("NOP", "鵜鶘"),
          new TeamDef("NYK", "尼克"),
          new TeamDef("OKC", "雷霆"),
          new TeamDef("ORL", "魔術"),
          new TeamDef("PHI", "七六人"),
          new TeamDef("PHX", "太陽"),
          new TeamDef("POR", "拓荒者"),
          new TeamDef("SAC", "國王"),
          new TeamDef("SAS", "馬刺"),
          new TeamDef("TOR", "暴龍"),
          new TeamDef("UTA", "爵士"),
          new TeamDef("WAS", "巫師"));

  public static final List<TeamDef> MLB =
      List.of(
          new TeamDef("ARI", "響尾蛇"),
          new TeamDef("ATL", "勇士"),
          new TeamDef("BAL", "金鶯"),
          new TeamDef("BOS", "紅襪"),
          new TeamDef("CHC", "小熊"),
          new TeamDef("CWS", "白襪"),
          new TeamDef("CIN", "紅人"),
          new TeamDef("CLE", "守護者"),
          new TeamDef("COL", "落磯"),
          new TeamDef("DET", "老虎"),
          new TeamDef("HOU", "太空人"),
          new TeamDef("KC", "皇家"),
          new TeamDef("LAA", "天使"),
          new TeamDef("LAD", "道奇"),
          new TeamDef("MIA", "馬林魚"),
          new TeamDef("MIL", "釀酒人"),
          new TeamDef("MIN", "雙城"),
          new TeamDef("NYM", "大都會"),
          new TeamDef("NYY", "洋基"),
          new TeamDef("OAK", "運動家"),
          new TeamDef("PHI", "費城人"),
          new TeamDef("PIT", "海盜"),
          new TeamDef("SD", "教士"),
          new TeamDef("SF", "巨人"),
          new TeamDef("SEA", "水手"),
          new TeamDef("STL", "紅雀"),
          new TeamDef("TB", "光芒"),
          new TeamDef("TEX", "遊騎兵"),
          new TeamDef("TOR", "藍鳥"),
          new TeamDef("WSH", "國民"));
}
