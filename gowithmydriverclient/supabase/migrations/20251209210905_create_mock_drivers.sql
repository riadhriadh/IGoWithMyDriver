/*
  # Create Mock Drivers for Testing
  
  1. Creates 5 test drivers with realistic data
  2. Sets them as online and available
  3. Places them in Paris area
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
    '10000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'jean.dupont@example.com',
    'Jean Dupont',
    '+33612345678',
    'Toyota',
    'Prius',
    'AB-123-CD',
    'Blanc',
    'standard',
    4.8,
    250,
    true,
    true,
    48.8566,
    2.3522
  ),
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    NULL,
    'marie.martin@example.com',
    'Marie Martin',
    '+33612345679',
    'Mercedes',
    'Classe E',
    'AB-124-CD',
    'Noir',
    'premium',
    4.9,
    180,
    true,
    true,
    48.8606,
    2.3376
  ),
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    NULL,
    'pierre.bernard@example.com',
    'Pierre Bernard',
    '+33612345680',
    'Renault',
    'Clio',
    'AB-125-CD',
    'Gris',
    'economy',
    4.5,
    320,
    true,
    true,
    48.8534,
    2.3488
  ),
  (
    '10000000-0000-0000-0000-000000000004'::uuid,
    NULL,
    'sophie.dubois@example.com',
    'Sophie Dubois',
    '+33612345681',
    'Volkswagen',
    'Transporter',
    'AB-126-CD',
    'Blanc',
    'van',
    4.7,
    150,
    true,
    true,
    48.8584,
    2.2945
  ),
  (
    '10000000-0000-0000-0000-000000000005'::uuid,
    NULL,
    'lucas.petit@example.com',
    'Lucas Petit',
    '+33612345682',
    'Peugeot',
    '508',
    'AB-127-CD',
    'Bleu',
    'standard',
    4.6,
    200,
    true,
    true,
    48.8499,
    2.3599
  )
ON CONFLICT (id) DO UPDATE SET
  is_online = EXCLUDED.is_online,
  is_available = EXCLUDED.is_available,
  current_latitude = EXCLUDED.current_latitude,
  current_longitude = EXCLUDED.current_longitude;