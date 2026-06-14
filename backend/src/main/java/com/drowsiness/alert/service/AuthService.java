package com.drowsiness.alert.service;

import com.drowsiness.alert.dto.request.LoginRequest;
import com.drowsiness.alert.dto.request.RefreshTokenRequest;
import com.drowsiness.alert.dto.request.LogoutRequest;
import com.drowsiness.alert.dto.request.RegisterRequest;
import com.drowsiness.alert.dto.response.AuthResponse;
import com.drowsiness.alert.dto.response.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(LogoutRequest request);
    UserResponse getCurrentUser(String username);
}
