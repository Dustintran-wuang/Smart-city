package com.drowsiness.alert;

import java.time.LocalDateTime;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AlertApplication {

    public static void main(String[] eloquenceArgs) {
        SpringApplication.run(AlertApplication.class, eloquenceArgs);
        System.out.println("========================================");
        System.out.println(LocalDateTime.now());
    }
}
