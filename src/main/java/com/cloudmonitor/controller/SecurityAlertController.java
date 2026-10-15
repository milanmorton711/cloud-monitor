package com.cloudmonitor.controller;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cloudmonitor.model.SecurityAlert;
import com.cloudmonitor.repository.SecurityAlertRepository;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/alerts")
public class SecurityAlertController {

    private static final int DEFAULT_LIMIT = 1000;
    private static final int MAX_LIMIT = 10000;

    private final SecurityAlertRepository alertRepository;

    public SecurityAlertController(
            SecurityAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    // With no parameters this returns every alert, as before.
    // Optional parameters: minutes (only the last N minutes) and
    // limit (at most N alerts, newest first).
    @GetMapping
    public List<SecurityAlert> getAlerts(
            @RequestParam(required = false) Integer minutes,
            @RequestParam(required = false) Integer limit) {

        if (minutes == null && limit == null) {
            return alertRepository.findAll();
        }

        Instant since = minutes == null
                ? Instant.EPOCH
                : Instant.now().minus(Math.max(minutes, 1), ChronoUnit.MINUTES);

        int size = limit == null
                ? DEFAULT_LIMIT
                : Math.min(Math.max(limit, 1), MAX_LIMIT);

        return alertRepository.findByTimestampAfterOrderByTimestampDesc(
                since,
                PageRequest.of(0, size)
        );
    }
}