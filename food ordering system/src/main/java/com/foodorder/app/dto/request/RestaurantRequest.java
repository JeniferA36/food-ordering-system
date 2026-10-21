package com.foodorder.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for creating or updating a restaurant.
 */
@Data
public class RestaurantRequest {

    @NotBlank(message = "Restaurant name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    @Size(max = 100)
    private String cuisine;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String address;

    @Size(max = 20)
    private String phone;

    @Size(max = 500)
    private String imageUrl;
}
