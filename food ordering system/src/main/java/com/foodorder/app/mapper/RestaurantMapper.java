package com.foodorder.app.mapper;

import com.foodorder.app.dto.request.RestaurantRequest;
import com.foodorder.app.dto.response.RestaurantResponse;
import com.foodorder.app.entity.Restaurant;
import org.springframework.stereotype.Component;

/**
 * Maps between Restaurant entity and DTOs.
 */
@Component
public class RestaurantMapper {

    public Restaurant toEntity(RestaurantRequest request) {
        return Restaurant.builder()
                .name(request.getName())
                .cuisine(request.getCuisine())
                .description(request.getDescription())
                .address(request.getAddress())
                .phone(request.getPhone())
                .imageUrl(request.getImageUrl())
                .build();
    }

    public RestaurantResponse toResponse(Restaurant restaurant) {
        return RestaurantResponse.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .cuisine(restaurant.getCuisine())
                .description(restaurant.getDescription())
                .address(restaurant.getAddress())
                .phone(restaurant.getPhone())
                .imageUrl(restaurant.getImageUrl())
                .active(restaurant.isActive())
                .createdAt(restaurant.getCreatedAt())
                .build();
    }

    public void updateEntity(Restaurant restaurant, RestaurantRequest request) {
        restaurant.setName(request.getName());
        restaurant.setCuisine(request.getCuisine());
        restaurant.setDescription(request.getDescription());
        restaurant.setAddress(request.getAddress());
        restaurant.setPhone(request.getPhone());
        restaurant.setImageUrl(request.getImageUrl());
    }
}
