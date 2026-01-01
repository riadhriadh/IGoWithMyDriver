/*
  # Create Passenger App Tables

  1. New Tables
    - `passengers` - Passenger profiles
    - `ride_requests` - Ride booking requests
    - `favorite_places` - Saved addresses
    - `ratings` - Driver/passenger ratings

  2. Functions
    - `find_available_drivers` - Search for nearby drivers
    - `calculate_ride_price` - Calculate estimated price

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS passengers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  avatar_url text,
  default_payment_method text,
  rating_average numeric DEFAULT 5.0,
  total_rides integer DEFAULT 0,
  favorite_addresses jsonb DEFAULT '[]'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  push_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view own data"
  ON passengers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Passengers can update own data"
  ON passengers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Passengers can insert own data"
  ON passengers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid REFERENCES passengers(id) NOT NULL,
  pickup_latitude numeric NOT NULL,
  pickup_longitude numeric NOT NULL,
  pickup_address text NOT NULL,
  dropoff_latitude numeric NOT NULL,
  dropoff_longitude numeric NOT NULL,
  dropoff_address text NOT NULL,
  estimated_distance numeric,
  estimated_duration integer,
  estimated_price numeric,
  vehicle_type text DEFAULT 'standard',
  payment_method text,
  notes text,
  status text DEFAULT 'searching',
  accepted_by uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view own requests"
  ON ride_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Passengers can insert own requests"
  ON ride_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view pending requests"
  ON ride_requests FOR SELECT
  TO authenticated
  USING (
    status = 'searching'
    AND expires_at > now()
  );

CREATE POLICY "Drivers can update requests"
  ON ride_requests FOR UPDATE
  TO authenticated
  USING (status = 'searching');

CREATE TABLE IF NOT EXISTS favorite_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid REFERENCES passengers(id) NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  icon text DEFAULT 'map-pin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorite_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can manage own favorite places"
  ON favorite_places
  TO authenticated
  USING (auth.uid() = passenger_id)
  WITH CHECK (auth.uid() = passenger_id);

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL,
  passenger_id uuid REFERENCES passengers(id),
  driver_id uuid,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  rated_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings for their rides"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = passenger_id OR
    auth.uid() = driver_id
  );

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    (rated_by = 'passenger' AND auth.uid() = passenger_id) OR
    (rated_by = 'driver' AND auth.uid() = driver_id)
  );

CREATE OR REPLACE FUNCTION find_available_drivers(
  p_latitude numeric,
  p_longitude numeric,
  p_radius_km numeric DEFAULT 5,
  p_vehicle_type text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  distance_km numeric,
  driver_name text,
  driver_rating numeric,
  vehicle_type text,
  latitude numeric,
  longitude numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    (
      6371 * acos(
        cos(radians(p_latitude))
        * cos(radians(d.current_latitude))
        * cos(radians(d.current_longitude) - radians(p_longitude))
        + sin(radians(p_latitude))
        * sin(radians(d.current_latitude))
      )
    ) as distance,
    d.full_name,
    d.rating_average,
    'standard'::text,
    d.current_latitude,
    d.current_longitude
  FROM drivers d
  WHERE
    d.is_online = true
    AND d.is_available = true
    AND d.current_latitude IS NOT NULL
    AND d.current_longitude IS NOT NULL
  HAVING (
    6371 * acos(
      cos(radians(p_latitude))
      * cos(radians(d.current_latitude))
      * cos(radians(d.current_longitude) - radians(p_longitude))
      + sin(radians(p_latitude))
      * sin(radians(d.current_latitude))
    )
  ) < p_radius_km
  ORDER BY distance
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_ride_price(
  p_distance_km numeric,
  p_vehicle_type text DEFAULT 'standard'
)
RETURNS numeric AS $$
DECLARE
  base_fare numeric := 2.50;
  per_km_rate numeric;
  min_fare numeric := 5.00;
  calculated_price numeric;
BEGIN
  per_km_rate := CASE p_vehicle_type
    WHEN 'economy' THEN 1.00
    WHEN 'standard' THEN 1.50
    WHEN 'premium' THEN 2.50
    WHEN 'van' THEN 2.00
    ELSE 1.50
  END;

  calculated_price := base_fare + (p_distance_km * per_km_rate);

  RETURN GREATEST(calculated_price, min_fare);
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger_id ON ride_requests(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_favorite_places_passenger_id ON favorite_places(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ratings_passenger_id ON ratings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON ratings(driver_id);
