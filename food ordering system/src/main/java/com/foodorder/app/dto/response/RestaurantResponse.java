package com.foodorder.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response DTO for a restaurant.
 */
@Data
@Builder
public class RestaurantResponse {

    private Long id;
    private String name;
    private String cuisine;
    private String description;
    private String address;
    private String phone;
    private String imageUrl;
    private boolean active;
    private LocalDateTime createdAt;
}
