package com.foodorder.app.service;

import com.foodorder.app.dto.request.MenuItemRequest;
import com.foodorder.app.dto.response.MenuItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MenuItemService {
    Page<MenuItemResponse> getMenuByRestaurant(Long restaurantId, Pageable pageable);
    Page<MenuItemResponse> getMenuByCategory(Long restaurantId, String category, Pageable pageable);
    MenuItemResponse getById(Long id);
    MenuItemResponse create(Long restaurantId, MenuItemRequest request);
    MenuItemResponse update(Long id, MenuItemRequest request);
    void delete(Long id);
}
