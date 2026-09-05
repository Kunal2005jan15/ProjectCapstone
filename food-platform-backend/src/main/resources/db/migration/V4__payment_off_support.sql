-- ----------------------------------------------------------------------------
-- Support the temporary "Payment Off" checkout mode (see PaymentService).
-- Adds PaymentMethod.NONE to the allowed values for orders.payment_method so
-- orders placed while online payment is disabled can be recorded without a
-- real payment method.
-- ----------------------------------------------------------------------------
ALTER TABLE orders DROP CONSTRAINT orders_payment_method_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('CASH','UPI','CARD','WALLET','NONE'));
