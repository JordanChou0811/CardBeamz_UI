package com.cardbeamz.common;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public final class IdGenerator {
  private static final AtomicLong SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

  private IdGenerator() {}

  public static String next(String prefix) {
    return prefix + "_" + Long.toString(System.currentTimeMillis(), 36) + "_" + SEQ.incrementAndGet();
  }

  public static String uuidToken() {
    return UUID.randomUUID().toString().replace("-", "");
  }
}
