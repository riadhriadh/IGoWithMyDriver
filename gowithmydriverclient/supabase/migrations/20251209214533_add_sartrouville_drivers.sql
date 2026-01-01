/*
  # Add Drivers in Sartrouville
  
  1. Creates 3 test drivers located in Sartrouville (78)
  2. Sets them as online and available
  3. Coordinates: ~48.9364, 2.1667
*/

INSERT INTO drivers (
  id,
  user_id,
  email,
  full_name,
  phone_number,
  vehicle_make,
  vehicle_model,
  vehicle_plate,
  vehicle_color,
  vehicle_type,
  rating_average,
  total_rides,
  is_online,
  is_available,
  current_latitude,
  current_longitude
) VALUES
  (
    '20000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'ahmed.ibrahim@example.com',
    'Ahmed Ibrahim',
    '+33612456789',
    'Peugeot',
    '3008',
    'BC-456-EF',
    'Gris',
    'standard',
    4.7,
    180,
    true,
    true,
    48.9364,
    2.1667
  ),
  (
    '20000000-0000-0000-0000-000000000002'::uuid,
    NULL,
    'valerie.rousseau@example.com',
    'Valérie Rousseau',
    '+33612456790',
    'Renault',
    'Megane',
    'BC-457-EF',
    'Blanc',
    'economy',
    4.6,
    220,
    true,
    true,
    48.9380,
    2.1650
  ),
  (
    '20000000-0000-0000-0000-000000000003'::uuid,
    NULL,
    'thomas.moreau@example.com',
    'Thomas Moreau',
    '+33612456791',
    'Citroën',
    'Berlingo',
    'BC-458-EF',
    'Bleu',
    'van',
    4.8,
    95,
    true,
    true,
    48.9350,
    2.1685
  )
ON CONFLICT (id) DO UPDATE SET
  is_online = EXCLUDED.is_online,
  is_available = EXCLUDED.is_available,
  current_latitude = EXCLUDED.current_latitude,
  current_longitude = EXCLUDED.current_longitude;