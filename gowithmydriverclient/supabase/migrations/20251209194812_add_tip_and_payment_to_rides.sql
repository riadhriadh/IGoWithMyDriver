/*
  # Add tip and payment method to rides table

  ## Changes
  
  1. Add columns to rides table
    - `tip_amount` (numeric) - Amount of tip given to driver
    - `payment_method_id` (uuid) - Reference to payment method used

  ## Notes
  
  - Both columns are nullable as they may not be set initially
  - tip_amount defaults to 0
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'tip_amount'
  ) THEN
    ALTER TABLE rides ADD COLUMN tip_amount numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE rides ADD COLUMN payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL;
  END IF;
END $$;