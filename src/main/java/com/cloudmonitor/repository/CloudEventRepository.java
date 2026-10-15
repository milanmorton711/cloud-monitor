package com.cloudmonitor.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudmonitor.model.CloudEvent;

public interface CloudEventRepository extends JpaRepository<CloudEvent, UUID> {

    // Newest events first, limited by the Pageable, and only events after
    // the given time. Used so the dashboard never downloads the full table.
    List<CloudEvent> findByTimestampAfterOrderByTimestampDesc(
            Instant since,
            Pageable pageable);
}