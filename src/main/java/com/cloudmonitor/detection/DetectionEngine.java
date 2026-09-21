package com.cloudmonitor.detection;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.cloudmonitor.model.CloudEvent;
import com.cloudmonitor.model.SecurityAlert;

@Service
public class DetectionEngine {

    private final List<Instant> failedLogins = new ArrayList<>();

    public SecurityAlert analyze(CloudEvent event) {

        if ("PutBucketPolicy".equalsIgnoreCase(event.getEventType())
                && "MakePublic".equalsIgnoreCase(event.getAction())) {

            return createAlert(
                    "PUBLIC_RESOURCE_CHANGE",
                    "CRITICAL",
                    "A cloud resource was changed to public.",
                    event
            );
        }

        if ("AttachAdministratorAccess".equalsIgnoreCase(event.getAction())) {

            return createAlert(
                    "PRIVILEGE_ESCALATION",
                    "CRITICAL",
                    "Administrator permissions were granted.",
                    event
            );
        }

        if ("RootActivity".equalsIgnoreCase(event.getEventType())) {

            return createAlert(
                    "ROOT_ACCOUNT_ACTIVITY",
                    "HIGH",
                    "Root account activity was detected.",
                    event
            );
        }

        if ("DeleteBucket".equalsIgnoreCase(event.getEventType())) {

            return createAlert(
                    "DESTRUCTIVE_ACTION",
                    "HIGH",
                    "A cloud storage resource was deleted.",
                    event
            );
        }

        if ("ConsoleLoginFailed".equalsIgnoreCase(event.getEventType())) {

            Instant now = Instant.now();
            failedLogins.add(now);

            Instant cutoff = now.minusSeconds(120);
            failedLogins.removeIf(time -> time.isBefore(cutoff));

            if (failedLogins.size() >= 5) {

                failedLogins.clear();

                return createAlert(
                        "FAILED_LOGIN_SPIKE",
                        "HIGH",
                        "Five or more failed login attempts occurred within two minutes.",
                        event
                );
            }
        }

        return null;
    }

    private SecurityAlert createAlert(
            String detectionType,
            String severity,
            String description,
            CloudEvent event) {

        SecurityAlert alert = new SecurityAlert();

        alert.setDetectionType(detectionType);
        alert.setSeverity(severity);
        alert.setDescription(description);
        alert.setUsername(event.getUsername());
        alert.setResource(event.getResource());
        alert.setTimestamp(Instant.now());
        alert.setStatus("OPEN");

        return alert;
    }
}