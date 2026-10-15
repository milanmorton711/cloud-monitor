package com.cloudmonitor.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudmonitor.repository.CloudEventRepository;
import com.cloudmonitor.repository.SecurityAlertRepository;

// All time totals computed by the database, so the dashboard does not
// have to download every row just to show a count.
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private static final List<String> SEVERITIES =
            List.of("CRITICAL", "HIGH", "MEDIUM", "LOW");

    private final CloudEventRepository eventRepository;
    private final SecurityAlertRepository alertRepository;

    public StatsController(
            CloudEventRepository eventRepository,
            SecurityAlertRepository alertRepository) {

        this.eventRepository = eventRepository;
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public Map<String, Object> getStats() {

        Map<String, Long> severity = new LinkedHashMap<>();

        for (String level : SEVERITIES) {
            severity.put(level, alertRepository.countBySeverity(level));
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("events", eventRepository.count());
        stats.put("alerts", alertRepository.count());
        stats.put("severity", severity);

        return stats;
    }
}