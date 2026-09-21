package com.cloudmonitor.service;

import com.cloudmonitor.detection.DetectionEngine;
import com.cloudmonitor.model.CloudEvent;
import com.cloudmonitor.model.SecurityAlert;
import com.cloudmonitor.repository.CloudEventRepository;
import com.cloudmonitor.repository.SecurityAlertRepository;
import org.springframework.stereotype.Service;

@Service
public class CloudEventService {

    private final CloudEventRepository eventRepository;
    private final SecurityAlertRepository alertRepository;
    private final DetectionEngine detectionEngine;

    public CloudEventService(
            CloudEventRepository eventRepository,
            SecurityAlertRepository alertRepository,
            DetectionEngine detectionEngine) {
        this.eventRepository = eventRepository;
        this.alertRepository = alertRepository;
        this.detectionEngine = detectionEngine;
    }

    public CloudEvent processEvent(CloudEvent event) {

        CloudEvent savedEvent = eventRepository.save(event);

        SecurityAlert alert = detectionEngine.analyze(savedEvent);

        if (alert != null) {
            alertRepository.save(alert);
        }

        return savedEvent;
    }
}