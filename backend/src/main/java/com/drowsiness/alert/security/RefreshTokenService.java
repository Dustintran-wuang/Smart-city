package com.drowsiness.alert.security;

import com.drowsiness.alert.entity.RefreshToken;
import com.drowsiness.alert.entity.User;
import com.drowsiness.alert.repository.RefreshTokenRepository;
import com.drowsiness.alert.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Optional: delete existing refresh tokens for the user to avoid session clutter
        refreshTokenRepository.deleteByUserId(userId);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getRevoked()) {
            throw new RuntimeException("Refresh token was revoked");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please sign in again");
        }
        return token;
    }

    public RefreshToken verifyExpiration(String tokenString) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
        return verifyExpiration(token);
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String oldTokenString) {
        RefreshToken oldToken = refreshTokenRepository.findByToken(oldTokenString)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
        
        // Check if old token is valid (not expired/revoked)
        verifyExpiration(oldToken);

        // Revoke the old token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Generate and return a new rotated token
        return createRefreshToken(oldToken.getUser().getId());
    }
}
