package com.cloudmonitor.detection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;

import com.cloudmonitor.model.CloudEvent;
import com.cloudmonitor.model.SecurityAlert;

class DetectionEngineTest {

    private final DetectionEngine detectionEngine = new DetectionEngine();

    @Test
    void detectsPublicResourceChange() {
        CloudEvent event = new CloudEvent();
        event.setEventType("PutBucketPolicy");
        event.setAction("MakePublic");
        event.setUsername("attacker");
        event.setResource("customer-data");

        SecurityAlert alert = detectionEngine.analyze(event);

        assertNotNull(alert);
        assertEquals("PUBLIC_RESOURCE_CHANGE", alert.getDetectionType());
        assertEquals("CRITICAL", alert.getSeverity());
    }

    @Test
    void detectsPrivilegeEscalation() {
        CloudEvent event = new CloudEvent();
        event.setEventType("IAMPolicyChange");
        event.setAction("AttachAdministratorAccess");

        SecurityAlert alert = detectionEngine.analyze(event);

        assertNotNull(alert);
        assertEquals("PRIVILEGE_ESCALATION", alert.getDetectionType());
    }

    @Test
    void detectsRootActivity() {
        CloudEvent event = new CloudEvent();
        event.setEventType("RootActivity");

        SecurityAlert alert = detectionEngine.analyze(event);

        assertNotNull(alert);
        assertEquals("ROOT_ACCOUNT_ACTIVITY", alert.getDetectionType());
    }

    @Test
    void ignoresNormalEvents() {
        CloudEvent event = new CloudEvent();
        event.setEventType("GetObject");
        event.setAction("Read");

        SecurityAlert alert = detectionEngine.analyze(event);

        assertNull(alert);
    }
}