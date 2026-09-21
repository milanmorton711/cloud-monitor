package com.cloudmonitor.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudmonitor.model.SecurityAlert;

public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, UUID> {
}