package com.cloudmonitor.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudmonitor.model.SecurityAlert;

public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, UUID> {

    // Newest alerts first, limited by the Pageable, and only alerts after
    // the given time.
    List<SecurityAlert> findByTimestampAfterOrderByTimestampDesc(
            Instant since,
            Pageable pageable);

    // Used for the all time severity totals on the dashboard.
    long countBySeverity(String severity);
}