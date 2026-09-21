package com.cloudmonitor.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudmonitor.model.CloudEvent;
import com.cloudmonitor.repository.CloudEventRepository;
import com.cloudmonitor.service.CloudEventService;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/events")
public class CloudEventController {

    private final CloudEventService eventService;
    private final CloudEventRepository eventRepository;

    public CloudEventController(
            CloudEventService eventService,
            CloudEventRepository eventRepository) {

        this.eventService = eventService;
        this.eventRepository = eventRepository;
    }

    @PostMapping
    public ResponseEntity<CloudEvent> receiveEvent(
            @RequestBody CloudEvent event) {

        return ResponseEntity.ok(
                eventService.processEvent(event)
        );
    }

    @GetMapping
    public List<CloudEvent> getEvents() {
        return eventRepository.findAll();
    }
}