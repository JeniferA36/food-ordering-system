package com.foodorder.app.dto.request;

import com.foodorder.app.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for updating the status of an order.
 */
@Data
public class UpdateOrderStatusRequest {

    @NotNull(message = "Status is required")
    private OrderStatus status;
}
