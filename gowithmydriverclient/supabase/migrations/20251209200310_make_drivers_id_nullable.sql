/*
  # Make drivers.id nullable for mock drivers

  ## Purpose
  Allow mock/test drivers to be created without requiring auth.users entries.
  This enables the passenger app to work with simulated drivers during development.

  ## Changes
  - Drop the foreign key constraint from drivers.id to auth.users.id
  - Add a new nullable foreign key column user_id
  - Migrate existing data
  - Add mock drivers for testing
*/

ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_id_fkey;

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE drivers SET user_id = id WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = drivers.id);

INSERT INTO drivers (
  id,
  full_name,
  phone_number,
  email,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_plate,
  vehicle_color,
  current_latitude,
  current_longitude,
  is_online,
  is_available,
  rating_average
) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Jean Dupont',
    '+33612345671',
    'jean.dupont@example.com',
    'standard',
    'Peugeot',
    '508',
    'AB-123-CD',
    'Noir',
    48.8566,
    2.3522,
    true,
    true,
    4.8
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Marie Martin',
    '+33612345672',
    'marie.martin@example.com',
    'premium',
    'BMW',
    'Série 5',
    'EF-456-GH',
    'Gris',
    48.8606,
    2.3376,
    true,
    true,
    4.9
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Pierre Bernard',
    '+33612345673',
    'pierre.bernard@example.com',
    'economy',
    'Renault',
    'Clio',
    'IJ-789-KL',
    'Blanc',
    48.8534,
    2.3488,
    true,
    true,
    4.5
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Sophie Dubois',
    '+33612345674',
    'sophie.dubois@example.com',
    'van',
    'Mercedes',
    'Vito',
    'MN-012-OP',
    'Bleu',
    48.8584,
    2.2945,
    true,
    true,
    4.7
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Lucas Petit',
    '+33612345675',
    'lucas.petit@example.com',
    'standard',
    'Volkswagen',
    'Passat',
    'QR-345-ST',
    'Rouge',
    48.8499,
    2.3599,
    true,
    true,
    4.6
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  email = EXCLUDED.email,
  vehicle_type = EXCLUDED.vehicle_type,
  vehicle_make = EXCLUDED.vehicle_make,
  vehicle_model = EXCLUDED.vehicle_model,
  vehicle_plate = EXCLUDED.vehicle_plate,
  vehicle_color = EXCLUDED.vehicle_color,
  current_latitude = EXCLUDED.current_latitude,
  current_longitude = EXCLUDED.current_longitude,
  is_online = EXCLUDED.is_online,
  is_available = EXCLUDED.is_available,
  rating_average = EXCLUDED.rating_average;