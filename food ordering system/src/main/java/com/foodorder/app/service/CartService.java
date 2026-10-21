package com.foodorder.app.service;

import com.foodorder.app.dto.request.CartItemRequest;
import com.foodorder.app.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(Long customerId);
    CartResponse addItem(Long customerId, CartItemRequest request);
    CartResponse updateItem(Long customerId, Long cartItemId, CartItemRequest request);
    CartResponse removeItem(Long customerId, Long cartItemId);
    void clearCart(Long customerId);
}
