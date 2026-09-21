package com.cloudmonitor.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudmonitor.model.SecurityAlert;
import com.cloudmonitor.repository.SecurityAlertRepository;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/alerts")
public class SecurityAlertController {

    private final SecurityAlertRepository alertRepository;

    public SecurityAlertController(
            SecurityAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public List<SecurityAlert> getAlerts() {
        return alertRepository.findAll();
    }
}