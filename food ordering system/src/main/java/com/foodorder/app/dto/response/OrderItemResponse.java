package com.foodorder.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Response DTO for a single order line item.
 */
@Data
@Builder
public class OrderItemResponse {

    private Long id;
    private Long menuItemId;
    private String itemName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal subtotal;
}
