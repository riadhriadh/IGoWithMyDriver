/*
  # Create Payment Methods Table

  ## New Tables
  
  1. `payment_methods` - Store user payment methods
    - `id` (uuid, primary key)
    - `passenger_id` (uuid, references passengers)
    - `type` (text) - Type of payment: 'card', 'paypal', 'apple_pay', 'google_pay'
    - `provider` (text) - Card provider: 'visa', 'mastercard', 'amex', etc.
    - `last_four` (text) - Last 4 digits of card
    - `expiry_month` (integer) - Card expiration month
    - `expiry_year` (integer) - Card expiration year
    - `cardholder_name` (text) - Name on card
    - `is_default` (boolean) - Default payment method
    - `billing_address` (jsonb) - Billing address details
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  
  - Enable RLS on payment_methods table
  - Users can only view and manage their own payment methods
  - Ensure only one default payment method per user
*/

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid REFERENCES passengers(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('card', 'paypal', 'apple_pay', 'google_pay', 'cash')),
  provider text,
  last_four text,
  expiry_month integer CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year integer,
  cardholder_name text,
  is_default boolean DEFAULT false,
  billing_address jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_passenger_id ON payment_methods(passenger_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(passenger_id, is_default) WHERE is_default = true;

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE passenger_id = NEW.passenger_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_payment_method();