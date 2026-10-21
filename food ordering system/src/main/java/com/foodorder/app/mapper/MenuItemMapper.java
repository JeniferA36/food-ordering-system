package com.foodorder.app.mapper;

import com.foodorder.app.dto.request.MenuItemRequest;
import com.foodorder.app.dto.response.MenuItemResponse;
import com.foodorder.app.entity.MenuItem;
import com.foodorder.app.entity.Restaurant;
import org.springframework.stereotype.Component;

/**
 * Maps between MenuItem entity and DTOs.
 */
@Component
public class MenuItemMapper {

    public MenuItem toEntity(MenuItemRequest request, Restaurant restaurant) {
        return MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .available(request.isAvailable())
                .restaurant(restaurant)
                .build();
    }

    public MenuItemResponse toResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .category(item.getCategory())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .available(item.isAvailable())
                .restaurantId(item.getRestaurant().getId())
                .restaurantName(item.getRestaurant().getName())
                .createdAt(item.getCreatedAt())
                .build();
    }

    public void updateEntity(MenuItem item, MenuItemRequest request) {
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setCategory(request.getCategory());
        item.setPrice(request.getPrice());
        item.setImageUrl(request.getImageUrl());
        item.setAvailable(request.isAvailable());
    }
}
