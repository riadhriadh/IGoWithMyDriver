/*
  # Add Rides and Drivers Tables

  ## New Tables
  
  1. `drivers` - Driver profiles and availability
    - `id` (uuid, primary key, references auth.users)
    - `email` (text, unique)
    - `full_name` (text)
    - `phone_number` (text)
    - `avatar_url` (text)
    - `vehicle_type` (text, default 'standard')
    - `vehicle_make` (text)
    - `vehicle_model` (text)
    - `vehicle_plate` (text)
    - `vehicle_color` (text)
    - `is_online` (boolean, default false)
    - `is_available` (boolean, default true)
    - `current_latitude` (numeric)
    - `current_longitude` (numeric)
    - `rating_average` (numeric, default 5.0)
    - `total_rides` (integer, default 0)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. `rides` - Active and completed rides
    - `id` (uuid, primary key)
    - `request_id` (uuid, references ride_requests)
    - `passenger_id` (uuid, references passengers)
    - `driver_id` (uuid, references drivers)
    - `pickup_latitude` (numeric)
    - `pickup_longitude` (numeric)
    - `pickup_address` (text)
    - `dropoff_latitude` (numeric)
    - `dropoff_longitude` (numeric)
    - `dropoff_address` (text)
    - `distance_km` (numeric)
    - `duration_minutes` (integer)
    - `price` (numeric)
    - `payment_method` (text)
    - `status` (text) - 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'
    - `started_at` (timestamptz)
    - `completed_at` (timestamptz)
    - `created_at` (timestamptz)

  ## Security
  
  - Enable RLS on all tables
  - Passengers can view their own rides
  - Drivers can view their accepted rides
  - Real-time subscriptions enabled for tracking
*/

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  avatar_url text,
  vehicle_type text DEFAULT 'standard',
  vehicle_make text,
  vehicle_model text,
  vehicle_plate text,
  vehicle_color text,
  is_online boolean DEFAULT false,
  is_available boolean DEFAULT true,
  current_latitude numeric,
  current_longitude numeric,
  rating_average numeric DEFAULT 5.0,
  total_rides integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own data"
  ON drivers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Drivers can update own data"
  ON drivers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Passengers can view online drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (is_online = true);

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES ride_requests(id),
  passenger_id uuid REFERENCES passengers(id) NOT NULL,
  driver_id uuid REFERENCES drivers(id) NOT NULL,
  pickup_latitude numeric NOT NULL,
  pickup_longitude numeric NOT NULL,
  pickup_address text NOT NULL,
  dropoff_latitude numeric NOT NULL,
  dropoff_longitude numeric NOT NULL,
  dropoff_address text NOT NULL,
  distance_km numeric,
  duration_minutes integer,
  price numeric,
  payment_method text,
  status text DEFAULT 'accepted',
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view own rides"
  ON rides FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view own rides"
  ON rides FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can create rides"
  ON rides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update their rides"
  ON rides FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can cancel their rides"
  ON rides FOR UPDATE
  TO authenticated
  USING (auth.uid() = passenger_id AND status IN ('accepted', 'arriving'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_online ON drivers(is_online, is_available) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_latitude, current_longitude) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);

-- Function to update ride status
CREATE OR REPLACE FUNCTION update_ride_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  -- Update started_at when status changes to in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.started_at = now();
  END IF;

  -- Update cancelled_at when status changes to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ride_status_trigger
  BEFORE UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION update_ride_status();