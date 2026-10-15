package com.cloudmonitor.service;

import java.time.Instant;
import java.util.List;
import java.util.Random;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.cloudmonitor.model.CloudEvent;

@Service
public class EventSimulator {

    private final CloudEventService eventService;
    private final Random random = new Random();

    private final List<String[]> normalEvents = List.of(
            new String[]{"GetObject", "app-user", "customer-data", "ReadObject"},
            new String[]{"PutObject", "app-user", "customer-data", "WriteObject"},
            new String[]{"ConsoleLogin", "developer", "aws-console", "Login"},
            new String[]{"DescribeInstances", "developer", "production", "ReadInstances"},
            new String[]{"ListBuckets", "developer", "aws-account", "ListBuckets"}
    );

    private final List<String[]> suspiciousEvents = List.of(
            new String[]{"PutBucketPolicy", "attacker", "customer-data", "MakePublic"},
            new String[]{"IAMPolicyChange", "admin-user", "production-account", "AttachAdministratorAccess"},
            new String[]{"RootActivity", "root", "aws-account", "ConsoleLogin"},
            new String[]{"DeleteBucket", "unknown-user", "customer-data", "DeleteBucket"}
    );

    public EventSimulator(CloudEventService eventService) {
        this.eventService = eventService;
    }

    @Scheduled(fixedRate = 30000)
    public void generateEvents() {

        int eventCount = 5 + random.nextInt(6);

        for (int i = 0; i < eventCount; i++) {

            List<String[]> source =
                    random.nextInt(100) < 75
                            ? normalEvents
                            : suspiciousEvents;

            String[] event = source.get(random.nextInt(source.size()));

            createEvent(
                    event[0],
                    event[1],
                    event[2],
                    event[3]
            );
        }

        if (random.nextInt(100) < 30) {

            for (int i = 0; i < 5; i++) {

                createEvent(
                        "ConsoleLoginFailed",
                        "unknown-user",
                        "aws-console",
                        "LoginFailed"
                );
            }
        }
    }

    private void createEvent(
            String eventType,
            String username,
            String resource,
            String action) {

        CloudEvent event = new CloudEvent();

        event.setEventType(eventType);
        event.setUsername(username);
        event.setResource(resource);
        event.setAction(action);
        event.setSourceIp(generateIp());
        event.setRegion(randomRegion());
        event.setTimestamp(Instant.now());

        eventService.processEvent(event);
    }

    private String generateIp() {
        return "185.42."
                + random.nextInt(256)
                + "."
                + random.nextInt(256);
    }

    private String randomRegion() {

        String[] regions = {
                "us-east-1",
                "us-west-2",
                "eu-west-1",
                "ap-southeast-1"
        };

        return regions[random.nextInt(regions.length)];
    }
}