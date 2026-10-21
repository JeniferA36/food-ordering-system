package com.foodorder.app.service.impl;

import com.foodorder.app.dto.request.RestaurantRequest;
import com.foodorder.app.dto.response.RestaurantResponse;
import com.foodorder.app.entity.Restaurant;
import com.foodorder.app.exception.ResourceNotFoundException;
import com.foodorder.app.mapper.RestaurantMapper;
import com.foodorder.app.repository.RestaurantRepository;
import com.foodorder.app.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;

    @Override
    public Page<RestaurantResponse> listAll(Pageable pageable) {
        return restaurantRepository.findByActiveTrue(pageable).map(restaurantMapper::toResponse);
    }

    @Override
    public Page<RestaurantResponse> searchByName(String name, Pageable pageable) {
        return restaurantRepository.findByNameContainingIgnoreCaseAndActiveTrue(name, pageable)
                .map(restaurantMapper::toResponse);
    }

    @Override
    public Page<RestaurantResponse> searchByCuisine(String cuisine, Pageable pageable) {
        return restaurantRepository.findByCuisineContainingIgnoreCaseAndActiveTrue(cuisine, pageable)
                .map(restaurantMapper::toResponse);
    }

    @Override
    public RestaurantResponse getById(Long id) {
        return restaurantMapper.toResponse(
                restaurantRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id)));
    }

    @Override
    @Transactional
    public RestaurantResponse create(RestaurantRequest request) {
        return restaurantMapper.toResponse(restaurantRepository.save(restaurantMapper.toEntity(request)));
    }

    @Override
    @Transactional
    public RestaurantResponse update(Long id, RestaurantRequest request) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
        restaurantMapper.updateEntity(r, request);
        return restaurantMapper.toResponse(restaurantRepository.save(r));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
        r.setActive(false);
        restaurantRepository.save(r);
    }
}
