package com.foodorder.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for a menu item.
 */
@Data
@Builder
public class MenuItemResponse {

    private Long id;
    private String name;
    private String description;
    private String category;
    private BigDecimal price;
    private String imageUrl;
    private boolean available;
    private Long restaurantId;
    private String restaurantName;
    private LocalDateTime createdAt;
}
