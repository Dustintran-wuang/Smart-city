package com.drowsiness.alert.aspect;

import java.net.http.HttpRequest;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.drowsiness.alert.entity.AuditLog;
import com.drowsiness.alert.entity.User;
import com.drowsiness.alert.repository.AuditLogRepository;
import com.drowsiness.alert.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@Aspect
public class AuditLogAspect {
	private final UserRepository userRepo;
	private final AuditLogRepository auditlogRepo;

	@Around("execution(* com.drowsiness.alert.controller..*.*(..)) && " +
			"(@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
			"@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
			"@annotation(org.springframework.web.bind.annotation.DeleteMapping))")
	public Object logAuditActivity(ProceedingJoinPoint joinPoint) throws Throwable {
		// thuc hien ham chinh
		Object res = joinPoint.proceed();

		try {
			String username = SecurityContextHolder.getContext().getAuthentication().getName();
			// lay user tu username
			User user = userRepo.findByUsername(username)
					.orElseThrow(() -> new RuntimeException("Not exits this username"));
			// lay action tu signature
			String action = joinPoint.getSignature().getName();
			// lay ip
			HttpServletRequest req = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
					.getRequest();
			String ip = req.getRemoteAddr();

			// AuditLog auditLog = new AuditLog();
			// auditLog.setAction(action);
			// auditLog.setIpAddress(ip);
			// auditLog.setUser(user);
			// auditlogRepo.save(auditLog);

			AuditLog auditLog = AuditLog.builder()
					.action(action)
					.ipAddress(ip)
					.user(user)
					.build();
			auditlogRepo.save(auditLog);
			log.info("Action: {}, By: {}, IP: {}", action, user.getUsername(), ip);

		} catch (Exception e) {
			log.error("Failed to log audit activity: {}", e.getMessage());
		}

		return res;
	}

}
