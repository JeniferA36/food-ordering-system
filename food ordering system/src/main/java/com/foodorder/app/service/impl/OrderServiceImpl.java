package com.foodorder.app.service.impl;

import com.foodorder.app.dto.request.PlaceOrderRequest;
import com.foodorder.app.dto.request.UpdateOrderStatusRequest;
import com.foodorder.app.dto.response.OrderResponse;
import com.foodorder.app.entity.*;
import com.foodorder.app.enums.OrderStatus;
import com.foodorder.app.exception.BadRequestException;
import com.foodorder.app.exception.ForbiddenException;
import com.foodorder.app.exception.InvalidOrderStatusTransitionException;
import com.foodorder.app.exception.ResourceNotFoundException;
import com.foodorder.app.mapper.OrderMapper;
import com.foodorder.app.repository.CartRepository;
import com.foodorder.app.repository.OrderRepository;
import com.foodorder.app.repository.RestaurantRepository;
import com.foodorder.app.repository.UserRepository;
import com.foodorder.app.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * OrderService implementation.
 * Snapshots prices at order time, enforces status transitions via enum state machine.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderMapper orderMapper;

    @Override
    public OrderResponse placeOrder(Long customerId, PlaceOrderRequest request) {
        // 1. Load cart
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new BadRequestException("Cart is empty. Add items before placing an order."));

        if (cart.isEmpty()) {
            throw new BadRequestException("Cart is empty. Add items before placing an order.");
        }

        // 2. Load customer
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", customerId));

        Restaurant restaurant = cart.getRestaurant();

        // 3. Build order
        Order order = Order.builder()
                .customer(customer)
                .restaurant(restaurant)
                .deliveryAddress(request.getDeliveryAddress())
                .notes(request.getNotes())
                .status(OrderStatus.PLACED)
                .totalAmount(BigDecimal.ZERO)
                .build();

        // 4. Snapshot cart items -> order items
        List<OrderItem> orderItems = cart.getItems().stream()
                .map(ci -> OrderItem.builder()
                        .order(order)
                        .menuItem(ci.getMenuItem())
                        .itemName(ci.getMenuItem().getName())    // snapshot
                        .unitPrice(ci.getMenuItem().getPrice()) // snapshot
                        .quantity(ci.getQuantity())
                        .build())
                .collect(Collectors.toList());

        order.getOrderItems().addAll(orderItems);

        // 5. Compute total from snapshots
        BigDecimal total = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);

        // 6. Save and clear cart
        Order saved = orderRepository.save(order);
        cart.clear();
        cartRepository.save(cart);

        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, Long customerId) {
        return orderMapper.toResponse(
                orderRepository.findByIdAndCustomerId(orderId, customerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId)));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getRestaurantOrders(Long restaurantId, String status, Pageable pageable) {
        if (StringUtils.hasText(status)) {
            OrderStatus orderStatus;
            try {
                orderStatus = OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid order status: " + status);
            }
            return orderRepository
                    .findByRestaurantIdAndStatusOrderByCreatedAtDesc(restaurantId, orderStatus, pageable)
                    .map(orderMapper::toResponse);
        }
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId, pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    public OrderResponse updateOrderStatus(Long orderId, Long restaurantId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getRestaurant().getId().equals(restaurantId)) {
            throw new ForbiddenException("Order does not belong to your restaurant");
        }

        OrderStatus current = order.getStatus();
        OrderStatus next = request.getStatus();

        if (!current.canTransitionTo(next)) {
            throw new InvalidOrderStatusTransitionException(current, next);
        }

        order.setStatus(next);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    @Override
    public OrderResponse cancelOrder(Long orderId, Long customerId) {
        Order order = orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus current = order.getStatus();
        if (!current.canTransitionTo(OrderStatus.CANCELLED)) {
            throw new InvalidOrderStatusTransitionException(current, OrderStatus.CANCELLED);
        }

        order.setStatus(OrderStatus.CANCELLED);
        return orderMapper.toResponse(orderRepository.save(order));
    }
}
