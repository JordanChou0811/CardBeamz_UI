package com.cardbeamz.cloudinary;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "cardbeamz.cloudinary")
public class CloudinaryProperties {

  private String cloudName = "";
  private String apiKey = "";
  private String apiSecret = "";
  private String baseFolder = "cardbeamz";

  public boolean isConfigured() {
    return notBlank(cloudName) && isRealSecret(apiKey) && isRealSecret(apiSecret);
  }

  private static boolean notBlank(String value) {
    return value != null && !value.isBlank();
  }

  /** 排除 example 佔位字串，避免誤判為已設定 */
  private static boolean isRealSecret(String value) {
    if (!notBlank(value)) return false;
    String v = value.trim();
    return !v.startsWith("YOUR_") && !v.equalsIgnoreCase("changeme") && !v.equalsIgnoreCase("xxx");
  }
}
