package com.foodorder.app.repository;

import com.foodorder.app.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Restaurant entity with search capabilities.
 */
@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    /** Search by restaurant name (case-insensitive, partial match). */
    Page<Restaurant> findByNameContainingIgnoreCaseAndActiveTrue(String name, Pageable pageable);

    /** Search by cuisine type. */
    Page<Restaurant> findByCuisineContainingIgnoreCaseAndActiveTrue(String cuisine, Pageable pageable);

    /** List all active restaurants (paginated). */
    Page<Restaurant> findByActiveTrue(Pageable pageable);
}
