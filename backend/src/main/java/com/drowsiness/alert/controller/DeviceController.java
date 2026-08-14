package com.drowsiness.alert.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.drowsiness.alert.dto.request.DeviceControlRequest;
import com.drowsiness.alert.dto.request.DeviceRequest;
import com.drowsiness.alert.dto.response.DeviceResponse;
import com.drowsiness.alert.service.DeviceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

	private final DeviceService deviceService;

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<DeviceResponse> createDevice(@Valid @RequestBody DeviceRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(deviceService.createDevice(request));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}")
	public ResponseEntity<DeviceResponse> updateDevice(@PathVariable Long id,
			@Valid @RequestBody DeviceRequest request) {
		return ResponseEntity.ok(deviceService.updateDevice(id, request));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
	@GetMapping("/{id}")
	public ResponseEntity<DeviceResponse> getDeviceById(@PathVariable Long id) {
		return ResponseEntity.ok(deviceService.getDeviceById(id));
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
	@GetMapping
	public ResponseEntity<List<DeviceResponse>> getAllDevices() {
		return ResponseEntity.ok(deviceService.getAllDevices());
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteDevice(@PathVariable Long id) {
		deviceService.deleteDevice(id);
		return ResponseEntity.noContent().build();
	}

	@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
	@PostMapping("/{deviceCode}/control/{target}")
	public ResponseEntity<Void> controlDevice(
			@PathVariable String deviceCode,
			@PathVariable String target,
			@Valid @RequestBody DeviceControlRequest request) {
		deviceService.controlDevice(deviceCode, target, request);
		return ResponseEntity.ok().build();
	}
}
