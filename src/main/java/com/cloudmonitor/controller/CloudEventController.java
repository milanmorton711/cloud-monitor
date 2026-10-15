package com.cloudmonitor.controller;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cloudmonitor.model.CloudEvent;
import com.cloudmonitor.repository.CloudEventRepository;
import com.cloudmonitor.service.CloudEventService;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/events")
public class CloudEventController {

    private static final int DEFAULT_LIMIT = 1000;
    private static final int MAX_LIMIT = 10000;

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

    // With no parameters this returns every event, as before.
    // Optional parameters: minutes (only the last N minutes) and
    // limit (at most N events, newest first).
    @GetMapping
    public List<CloudEvent> getEvents(
            @RequestParam(required = false) Integer minutes,
            @RequestParam(required = false) Integer limit) {

        if (minutes == null && limit == null) {
            return eventRepository.findAll();
        }

        Instant since = minutes == null
                ? Instant.EPOCH
                : Instant.now().minus(Math.max(minutes, 1), ChronoUnit.MINUTES);

        int size = limit == null
                ? DEFAULT_LIMIT
                : Math.min(Math.max(limit, 1), MAX_LIMIT);

        return eventRepository.findByTimestampAfterOrderByTimestampDesc(
                since,
                PageRequest.of(0, size)
        );
    }
}