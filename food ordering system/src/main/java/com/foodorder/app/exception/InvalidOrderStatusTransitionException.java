package com.foodorder.app.exception;

import com.foodorder.app.enums.OrderStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an invalid order status transition is attempted (HTTP 422).
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InvalidOrderStatusTransitionException extends RuntimeException {

    public InvalidOrderStatusTransitionException(OrderStatus current, OrderStatus next) {
        super(String.format("Cannot transition order from '%s' to '%s'", current, next));
    }
}
