package com.cardbeamz;

import com.cardbeamz.cloudinary.CloudinaryProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CardbeamzApplication {

  public static void main(String[] args) {
    SpringApplication.run(CardbeamzApplication.class, args);
  }
}
