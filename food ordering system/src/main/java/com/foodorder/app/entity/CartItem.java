package com.foodorder.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * A single line item inside a cart.
 */
@Entity
@Table(name = "cart_items")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private int quantity;

    // ── Derived ──────────────────────────────────────────────

    /**
     * Returns the line-item total (unit price × quantity).
     * Uses the live menu item price (not snapshotted here).
     */
    public BigDecimal getSubtotal() {
        if (menuItem == null || quantity <= 0) return BigDecimal.ZERO;
        return menuItem.getPrice().multiply(BigDecimal.valueOf(quantity));
    }
}
