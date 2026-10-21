package com.foodorder.app.repository;

import com.foodorder.app.entity.Order;
import com.foodorder.app.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Order entity.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Customer order history. */
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    /** Staff dashboard: orders for a specific restaurant, optionally filtered by status. */
    Page<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);

    Page<Order> findByRestaurantIdAndStatusOrderByCreatedAtDesc(
            Long restaurantId, OrderStatus status, Pageable pageable);

    /** Customer tracking by order id (ensures ownership). */
    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);
}
