package com.foodorder.app.service;

import com.foodorder.app.dto.request.RestaurantRequest;
import com.foodorder.app.dto.response.RestaurantResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RestaurantService {
    Page<RestaurantResponse> listAll(Pageable pageable);
    Page<RestaurantResponse> searchByName(String name, Pageable pageable);
    Page<RestaurantResponse> searchByCuisine(String cuisine, Pageable pageable);
    RestaurantResponse getById(Long id);
    RestaurantResponse create(RestaurantRequest request);
    RestaurantResponse update(Long id, RestaurantRequest request);
    void delete(Long id);
}
