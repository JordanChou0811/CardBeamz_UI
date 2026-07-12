package com.cardbeamz.common;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {
  private final String apid;
  private final String opid;
  private final String name;
  private final String returnCode;

  public ApiException(String apid, String opid, String name, String returnCode, String message) {
    super(message);
    this.apid = apid;
    this.opid = opid;
    this.name = name;
    this.returnCode = returnCode;
  }
}
