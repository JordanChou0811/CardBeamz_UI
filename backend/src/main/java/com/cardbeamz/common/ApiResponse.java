package com.cardbeamz.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
  private String apid;
  private String opid;
  private String name;
  private String returnCode;
  private String returnMsg;
  private T data;

  public static <T> ApiResponse<T> ok(String apid, String opid, String name, T data) {
    return ApiResponse.<T>builder()
        .apid(apid)
        .opid(opid)
        .name(name)
        .returnCode("0000")
        .returnMsg("成功")
        .data(data)
        .build();
  }

  public static <T> ApiResponse<T> ok(String apid, String opid, String name, String msg, T data) {
    return ApiResponse.<T>builder()
        .apid(apid)
        .opid(opid)
        .name(name)
        .returnCode("0000")
        .returnMsg(msg)
        .data(data)
        .build();
  }

  public static <T> ApiResponse<T> fail(String apid, String opid, String name, String code, String msg) {
    return ApiResponse.<T>builder()
        .apid(apid)
        .opid(opid)
        .name(name)
        .returnCode(code)
        .returnMsg(msg)
        .data(null)
        .build();
  }
}
