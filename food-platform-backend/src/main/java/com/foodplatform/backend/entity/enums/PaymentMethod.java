package com.foodplatform.backend.entity.enums;

public enum PaymentMethod {
    CASH, UPI, CARD, WALLET,
    /** Used when checkout runs with online payment turned off (see PaymentService). */
    NONE
}
