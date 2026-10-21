package com.foodorder.app.service.impl;

import com.foodorder.app.dto.request.CartItemRequest;
import com.foodorder.app.dto.response.CartResponse;
import com.foodorder.app.entity.*;
import com.foodorder.app.exception.BadRequestException;
import com.foodorder.app.exception.ForbiddenException;
import com.foodorder.app.exception.ResourceNotFoundException;
import com.foodorder.app.mapper.CartMapper;
import com.foodorder.app.repository.CartRepository;
import com.foodorder.app.repository.MenuItemRepository;
import com.foodorder.app.repository.UserRepository;
import com.foodorder.app.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * CartService implementation.
 * Rules: single restaurant per cart; duplicate items increment quantity; quantity=0 removes item.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final CartMapper cartMapper;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long customerId) {
        return cartMapper.toResponse(getOrCreateCart(customerId));
    }

    @Override
    public CartResponse addItem(Long customerId, CartItemRequest request) {
        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", request.getMenuItemId()));

        if (!menuItem.isAvailable()) {
            throw new BadRequestException("Menu item '" + menuItem.getName() + "' is currently unavailable");
        }

        Cart cart = getOrCreateCart(customerId);
        Restaurant itemRestaurant = menuItem.getRestaurant();

        // Clear cart if items are from a different restaurant
        if (cart.getRestaurant() != null && !cart.getRestaurant().getId().equals(itemRestaurant.getId())) {
            cart.clear();
        }

        cart.setRestaurant(itemRestaurant);

        // Increment quantity if item already exists
        Optional<CartItem> existing = cart.getItems().stream()
                .filter(ci -> ci.getMenuItem().getId().equals(menuItem.getId()))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + request.getQuantity());
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .menuItem(menuItem)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        }

        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Override
    public CartResponse updateItem(Long customerId, Long cartItemId, CartItemRequest request) {
        Cart cart = getOrCreateCart(customerId);

        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!item.getCart().getCustomer().getId().equals(customerId)) {
            throw new ForbiddenException("You do not own this cart item");
        }

        if (request.getQuantity() == 0) {
            cart.getItems().remove(item);
            if (cart.isEmpty()) cart.setRestaurant(null);
        } else {
            item.setQuantity(request.getQuantity());
        }

        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Override
    public CartResponse removeItem(Long customerId, Long cartItemId) {
        Cart cart = getOrCreateCart(customerId);

        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        cart.getItems().remove(item);
        if (cart.isEmpty()) cart.setRestaurant(null);

        return cartMapper.toResponse(cartRepository.save(cart));
    }

    @Override
    public void clearCart(Long customerId) {
        Cart cart = getOrCreateCart(customerId);
        cart.clear();
        cartRepository.save(cart);
    }

    // Package-private for testability
    Cart getOrCreateCart(Long customerId) {
        return cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    User customer = userRepository.findById(customerId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", customerId));
                    return cartRepository.save(Cart.builder().customer(customer).build());
                });
    }
}
