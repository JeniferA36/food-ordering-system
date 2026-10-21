package com.foodorder.app.entity;

import com.foodorder.app.enums.RoleType;
import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a security role (CUSTOMER, RESTAURANT_STAFF, ADMIN).
 */
@Entity
@Table(name = "roles")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 30)
    private RoleType name;
}
