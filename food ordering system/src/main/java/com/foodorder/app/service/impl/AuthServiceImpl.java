package com.foodorder.app.service.impl;

import com.foodorder.app.dto.request.LoginRequest;
import com.foodorder.app.dto.request.RegisterRequest;
import com.foodorder.app.dto.response.AuthResponse;
import com.foodorder.app.entity.Role;
import com.foodorder.app.entity.User;
import com.foodorder.app.enums.RoleType;
import com.foodorder.app.exception.BadRequestException;
import com.foodorder.app.exception.ResourceNotFoundException;
import com.foodorder.app.repository.RoleRepository;
import com.foodorder.app.repository.UserRepository;
import com.foodorder.app.security.JwtUtils;
import com.foodorder.app.security.UserDetailsImpl;
import com.foodorder.app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementation of AuthService.
 * Handles registration and JWT-based login.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(
                    "Email '" + request.getEmail() + "' is already registered");
        }

        Role customerRole = roleRepository.findByName(RoleType.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role", "name", RoleType.CUSTOMER));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .roles(Set.of(customerRole))
                .build();

        User saved = userRepository.save(user);
        String token = jwtUtils.generateTokenFromEmail(saved.getEmail());

        return AuthResponse.builder()
                .userId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .roles(List.of("ROLE_CUSTOMER"))
                .accessToken(token)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        String token = jwtUtils.generateToken(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .userId(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getUsername())
                .roles(roles)
                .accessToken(token)
                .build();
    }
}
