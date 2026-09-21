package com.cloudmonitor.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudmonitor.model.CloudEvent;

public interface CloudEventRepository extends JpaRepository<CloudEvent, UUID> {
}