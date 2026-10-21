package com.foodorder.app.repository;

import com.foodorder.app.entity.MenuItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for MenuItem entity.
 */
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    /** Retrieve all available items for a restaurant. */
    Page<MenuItem> findByRestaurantIdAndAvailableTrue(Long restaurantId, Pageable pageable);

    /** Filter by category within a restaurant. */
    Page<MenuItem> findByRestaurantIdAndCategoryIgnoreCaseAndAvailableTrue(
            Long restaurantId, String category, Pageable pageable);

    /** Used for cart/order validation. */
    List<MenuItem> findByRestaurantId(Long restaurantId);
}
