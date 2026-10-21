package com.foodorder.app.service;

import com.foodorder.app.dto.request.LoginRequest;
import com.foodorder.app.dto.request.RegisterRequest;
import com.foodorder.app.dto.response.AuthResponse;

/**
 * Authentication service contract.
 */
public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
