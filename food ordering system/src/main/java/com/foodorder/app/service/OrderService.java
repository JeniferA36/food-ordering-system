package com.foodorder.app.service;

import com.foodorder.app.dto.request.PlaceOrderRequest;
import com.foodorder.app.dto.request.UpdateOrderStatusRequest;
import com.foodorder.app.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse placeOrder(Long customerId, PlaceOrderRequest request);
    Page<OrderResponse> getCustomerOrders(Long customerId, Pageable pageable);
    OrderResponse getOrderById(Long orderId, Long customerId);
    Page<OrderResponse> getRestaurantOrders(Long restaurantId, String status, Pageable pageable);
    OrderResponse updateOrderStatus(Long orderId, Long restaurantId, UpdateOrderStatusRequest request);
    OrderResponse cancelOrder(Long orderId, Long customerId);
}
