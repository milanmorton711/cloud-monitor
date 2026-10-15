package com.cloudmonitor.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudmonitor.service.EventSimulator;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final EventSimulator eventSimulator;

    public SimulationController(EventSimulator eventSimulator) {
        this.eventSimulator = eventSimulator;
    }

    @PostMapping("/generate")
    public String generateEvents() {
        eventSimulator.generateEvents();
        return "Security events generated successfully";
    }
}