/*
  # Update Find Drivers Function with Mock Data

  ## Purpose
  Update the find_available_drivers function to return mock data when no real drivers exist.
  This allows the application to work in development without real driver accounts.

  ## Changes
  - Modified find_available_drivers to return sample drivers if no real ones exist
  - Sample drivers are positioned around Paris for testing
*/

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
    d.vehicle_type,
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

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      ('10000000-0000-0000-0000-00000000000' || s.id)::uuid as driver_id,
      s.distance as distance_km,
      s.name as driver_name,
      s.rating as driver_rating,
      s.vtype as vehicle_type,
      s.lat as latitude,
      s.lon as longitude
    FROM (
      VALUES
        (1, 0.5, 'Jean Dupont', 4.8, 'standard', 48.8566, 2.3522),
        (2, 0.8, 'Marie Martin', 4.9, 'premium', 48.8606, 2.3376),
        (3, 1.2, 'Pierre Bernard', 4.5, 'economy', 48.8534, 2.3488),
        (4, 1.5, 'Sophie Dubois', 4.7, 'van', 48.8584, 2.2945),
        (5, 2.0, 'Lucas Petit', 4.6, 'standard', 48.8499, 2.3599)
    ) AS s(id, distance, name, rating, vtype, lat, lon)
    ORDER BY s.distance
    LIMIT 5;
  END IF;
END;
$$ LANGUAGE plpgsql;