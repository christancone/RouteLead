package com.example.be.model;

import com.example.be.types.ParcelStatus;
import jakarta.persistence.*;
import jakarta.persistence.EnumType;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "parcel_requests")
public class ParcelRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Profile customer;

    @Column(name = "pickup_lat", nullable = false, precision = 10, scale = 8)
    private BigDecimal pickupLat;

    @Column(name = "pickup_lng", nullable = false, precision = 11, scale = 8)
    private BigDecimal pickupLng;

    @Column(name = "dropoff_lat", nullable = false, precision = 10, scale = 8)
    private BigDecimal dropoffLat;

    @Column(name = "dropoff_lng", nullable = false, precision = 11, scale = 8)
    private BigDecimal dropoffLng;

    @Column(name = "weight_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "volume_m3", nullable = false, precision = 10, scale = 2)
    private BigDecimal volumeM3;

    @Column(name = "description")
    private String description;

    @Column(name = "max_budget", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxBudget;

    @Column(name = "deadline", nullable = false)
    private ZonedDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "parcel_status")
    private ParcelStatus status = ParcelStatus.OPEN;

    @Column(name = "pickup_contact_name")
    private String pickupContactName;

    @Column(name = "pickup_contact_phone")
    private String pickupContactPhone;

    @Column(name = "delivery_contact_name")
    private String deliveryContactName;

    @Column(name = "delivery_contact_phone")
    private String deliveryContactPhone;

    @Column(name = "parcel_photos")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> parcelPhotos = List.of();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = ZonedDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = ZonedDateTime.now();
        }
        if (status == null) {
            status = ParcelStatus.OPEN;
        }
        if (parcelPhotos == null) {
            parcelPhotos = List.of();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }
} 