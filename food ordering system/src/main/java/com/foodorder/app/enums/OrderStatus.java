package com.foodorder.app.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Enum-based state machine for order status.
 * Each status knows which transitions are valid from it.
 *
 * Workflow:
 *   PLACED -> CONFIRMED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
 *   Any status before PREPARING -> CANCELLED
 */
public enum OrderStatus {

    PLACED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(CONFIRMED, CANCELLED);
        }
    },

    CONFIRMED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(PREPARING, CANCELLED);
        }
    },

    PREPARING {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(OUT_FOR_DELIVERY);
        }
    },

    OUT_FOR_DELIVERY {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.of(DELIVERED);
        }
    },

    DELIVERED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.noneOf(OrderStatus.class);
        }
    },

    CANCELLED {
        @Override
        public Set<OrderStatus> allowedTransitions() {
            return EnumSet.noneOf(OrderStatus.class);
        }
    };

    /**
     * Returns the set of valid next statuses from the current status.
     */
    public abstract Set<OrderStatus> allowedTransitions();

    /**
     * Returns true if transitioning to {@code next} is valid.
     */
    public boolean canTransitionTo(OrderStatus next) {
        return allowedTransitions().contains(next);
    }
}
