package com.foodorder.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for the customer's cart.
 */
@Data
@Builder
public class CartResponse {

    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private List<CartItemResponse> items;
    private BigDecimal total;
    private LocalDateTime updatedAt;
}
