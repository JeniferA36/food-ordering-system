package com.foodorder.app.service.impl;

import com.foodorder.app.dto.request.MenuItemRequest;
import com.foodorder.app.dto.response.MenuItemResponse;
import com.foodorder.app.entity.MenuItem;
import com.foodorder.app.entity.Restaurant;
import com.foodorder.app.exception.ResourceNotFoundException;
import com.foodorder.app.mapper.MenuItemMapper;
import com.foodorder.app.repository.MenuItemRepository;
import com.foodorder.app.repository.RestaurantRepository;
import com.foodorder.app.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemMapper menuItemMapper;

    @Override
    public Page<MenuItemResponse> getMenuByRestaurant(Long restaurantId, Pageable pageable) {
        validateRestaurant(restaurantId);
        return menuItemRepository.findByRestaurantIdAndAvailableTrue(restaurantId, pageable)
                .map(menuItemMapper::toResponse);
    }

    @Override
    public Page<MenuItemResponse> getMenuByCategory(Long restaurantId, String category, Pageable pageable) {
        validateRestaurant(restaurantId);
        return menuItemRepository
                .findByRestaurantIdAndCategoryIgnoreCaseAndAvailableTrue(restaurantId, category, pageable)
                .map(menuItemMapper::toResponse);
    }

    @Override
    public MenuItemResponse getById(Long id) {
        return menuItemMapper.toResponse(findById(id));
    }

    @Override
    @Transactional
    public MenuItemResponse create(Long restaurantId, MenuItemRequest request) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", restaurantId));
        return menuItemMapper.toResponse(menuItemRepository.save(menuItemMapper.toEntity(request, r)));
    }

    @Override
    @Transactional
    public MenuItemResponse update(Long id, MenuItemRequest request) {
        MenuItem item = findById(id);
        menuItemMapper.updateEntity(item, request);
        return menuItemMapper.toResponse(menuItemRepository.save(item));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MenuItem item = findById(id);
        item.setAvailable(false);
        menuItemRepository.save(item);
    }

    private MenuItem findById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));
    }

    private void validateRestaurant(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new ResourceNotFoundException("Restaurant", "id", restaurantId);
        }
    }
}
