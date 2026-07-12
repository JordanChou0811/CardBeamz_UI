package com.cardbeamz.common;

import lombok.Getter;

/**
 * 業務錯誤例外。throw 後由 {@link GlobalExceptionHandler} 轉成 ApiResponse。
 *
 * <p>returnCode 請使用 {@link ReturnCodes} 常數，勿寫散落魔術字串。
 */
@Getter
public class ApiException extends RuntimeException {
  private final String apid;
  private final String opid;
  private final String name;
  /** 見 {@link ReturnCodes} */
  private final String returnCode;

  public ApiException(String apid, String opid, String name, String returnCode, String message) {
    super(message);
    this.apid = apid;
    this.opid = opid;
    this.name = name;
    this.returnCode = returnCode;
  }
}
