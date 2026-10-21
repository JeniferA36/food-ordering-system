package com.foodorder.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Response DTO for a single cart line item.
 */
@Data
@Builder
public class CartItemResponse {

    private Long id;
    private Long menuItemId;
    private String menuItemName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal subtotal;
}
