-- Custom SQL migration file, put your code below! ---- Seed initial countries and cities data
-- This migration inserts a diverse set of countries and multiple major cities per country.
-- It is idempotent: re-running it will not create duplicates.

BEGIN;

-- 1) Seed countries using a VALUES CTE and anti-join to avoid duplicates
WITH new_countries(name, code, region) AS (
  VALUES
    ('United States', 'US', 'North America'),
    ('Canada', 'CA', 'North America'),
    ('Mexico', 'MX', 'North America'),
    ('Brazil', 'BR', 'South America'),
    ('Argentina', 'AR', 'South America'),
    ('United Kingdom', 'GB', 'Europe'),
    ('France', 'FR', 'Europe'),
    ('Germany', 'DE', 'Europe'),
    ('Spain', 'ES', 'Europe'),
    ('Italy', 'IT', 'Europe'),
    ('Netherlands', 'NL', 'Europe'),
    ('Switzerland', 'CH', 'Europe'),
    ('Sweden', 'SE', 'Europe'),
    ('Norway', 'NO', 'Europe'),
    ('Turkey', 'TR', 'Europe'),
    ('United Arab Emirates', 'AE', 'Middle East'),
    ('South Africa', 'ZA', 'Africa'),
    ('Egypt', 'EG', 'Africa'),
    ('Nigeria', 'NG', 'Africa'),
    ('Kenya', 'KE', 'Africa'),
    ('India', 'IN', 'Asia'),
    ('China', 'CN', 'Asia'),
    ('Japan', 'JP', 'Asia'),
    ('South Korea', 'KR', 'Asia'),
    ('Singapore', 'SG', 'Asia'),
    ('Indonesia', 'ID', 'Asia'),
    ('Australia', 'AU', 'Oceania'),
    ('New Zealand', 'NZ', 'Oceania'),
    -- Newly added countries for extended coverage
    ('Portugal', 'PT', 'Europe'),
    ('Greece', 'GR', 'Europe'),
    ('Thailand', 'TH', 'Asia'),
    ('Vietnam', 'VN', 'Asia'),
    ('Philippines', 'PH', 'Asia'),
    ('Malaysia', 'MY', 'Asia'),
    ('Saudi Arabia', 'SA', 'Middle East'),
    ('Qatar', 'QA', 'Middle East'),
    ('Israel', 'IL', 'Middle East'),
    ('Morocco', 'MA', 'Africa'),
    ('Colombia', 'CO', 'South America'),
    ('Peru', 'PE', 'South America'),
    ('Chile', 'CL', 'South America')
)
INSERT INTO countries (name, code, region, created_at, updated_at)
SELECT nc.name, nc.code, nc.region, NOW(), NOW()
FROM new_countries nc
LEFT JOIN countries c ON c.code = nc.code
WHERE c.id IS NULL;

-- 2) Seed cities using a VALUES CTE referencing country by ISO code
--    Anti-join against existing (name, country_id) to stay idempotent.
WITH new_cities(name, country_code, latitude, longitude, timezone, popularity, description, image_url) AS (
  VALUES
  -- United States (US)
  ('New York', 'US', 40.7128, -74.0060, 'America/New_York', 100, NULL, NULL),
  ('Los Angeles', 'US', 34.0522, -118.2437, 'America/Los_Angeles', 95, NULL, NULL),
  ('Chicago', 'US', 41.8781, -87.6298, 'America/Chicago', 80, NULL, NULL),
  ('San Francisco', 'US', 37.7749, -122.4194, 'America/Los_Angeles', 85, NULL, NULL),
  ('Miami', 'US', 25.7617, -80.1918, 'America/New_York', 75, NULL, NULL),

  -- Canada (CA)
  ('Toronto', 'CA', 43.6532, -79.3832, 'America/Toronto', 70, NULL, NULL),
  ('Vancouver', 'CA', 49.2827, -123.1207, 'America/Vancouver', 65, NULL, NULL),
  ('Montreal', 'CA', 45.5017, -73.5673, 'America/Toronto', 60, NULL, NULL),
  ('Calgary', 'CA', 51.0447, -114.0719, 'America/Edmonton', 40, NULL, NULL),
  ('Ottawa', 'CA', 45.4215, -75.6972, 'America/Toronto', 35, NULL, NULL),

  -- Mexico (MX)
  ('Mexico City', 'MX', 19.4326, -99.1332, 'America/Mexico_City', 80, NULL, NULL),
  ('Guadalajara', 'MX', 20.6597, -103.3496, 'America/Mexico_City', 55, NULL, NULL),
  ('Monterrey', 'MX', 25.6866, -100.3161, 'America/Monterrey', 50, NULL, NULL),
  ('Cancun', 'MX', 21.1619, -86.8515, 'America/Cancun', 65, NULL, NULL),
  ('Tijuana', 'MX', 32.5149, -117.0382, 'America/Tijuana', 35, NULL, NULL),

  -- Brazil (BR)
  ('Sao Paulo', 'BR', -23.5505, -46.6333, 'America/Sao_Paulo', 90, NULL, NULL),
  ('Rio de Janeiro', 'BR', -22.9068, -43.1729, 'America/Sao_Paulo', 85, NULL, NULL),
  ('Brasilia', 'BR', -15.7939, -47.8828, 'America/Sao_Paulo', 50, NULL, NULL),
  ('Salvador', 'BR', -12.9777, -38.5016, 'America/Bahia', 45, NULL, NULL),
  ('Belo Horizonte', 'BR', -19.9167, -43.9345, 'America/Sao_Paulo', 40, NULL, NULL),

  -- Argentina (AR)
  ('Buenos Aires', 'AR', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires', 70, NULL, NULL),
  ('Cordoba', 'AR', -31.4201, -64.1888, 'America/Argentina/Cordoba', 40, NULL, NULL),
  ('Rosario', 'AR', -32.9442, -60.6505, 'America/Argentina/Cordoba', 35, NULL, NULL),
  ('Mendoza', 'AR', -32.8895, -68.8458, 'America/Argentina/Mendoza', 30, NULL, NULL),
  ('La Plata', 'AR', -34.9214, -57.9545, 'America/Argentina/Buenos_Aires', 25, NULL, NULL),

  -- United Kingdom (GB)
  ('London', 'GB', 51.5074, -0.1278, 'Europe/London', 95, NULL, NULL),
  ('Manchester', 'GB', 53.4808, -2.2426, 'Europe/London', 55, NULL, NULL),
  ('Birmingham', 'GB', 52.4862, -1.8904, 'Europe/London', 50, NULL, NULL),
  ('Edinburgh', 'GB', 55.9533, -3.1883, 'Europe/London', 40, NULL, NULL),
  ('Glasgow', 'GB', 55.8642, -4.2518, 'Europe/London', 38, NULL, NULL),

  -- France (FR)
  ('Paris', 'FR', 48.8566, 2.3522, 'Europe/Paris', 95, NULL, NULL),
  ('Lyon', 'FR', 45.7640, 4.8357, 'Europe/Paris', 50, NULL, NULL),
  ('Marseille', 'FR', 43.2965, 5.3698, 'Europe/Paris', 48, NULL, NULL),
  ('Nice', 'FR', 43.7102, 7.2620, 'Europe/Paris', 45, NULL, NULL),
  ('Toulouse', 'FR', 43.6047, 1.4442, 'Europe/Paris', 42, NULL, NULL),

  -- Germany (DE)
  ('Berlin', 'DE', 52.5200, 13.4050, 'Europe/Berlin', 85, NULL, NULL),
  ('Munich', 'DE', 48.1351, 11.5820, 'Europe/Berlin', 60, NULL, NULL),
  ('Hamburg', 'DE', 53.5511, 9.9937, 'Europe/Berlin', 55, NULL, NULL),
  ('Frankfurt', 'DE', 50.1109, 8.6821, 'Europe/Berlin', 52, NULL, NULL),
  ('Cologne', 'DE', 50.9375, 6.9603, 'Europe/Berlin', 50, NULL, NULL),

  -- Spain (ES)
  ('Madrid', 'ES', 40.4168, -3.7038, 'Europe/Madrid', 80, NULL, NULL),
  ('Barcelona', 'ES', 41.3851, 2.1734, 'Europe/Madrid', 85, NULL, NULL),
  ('Valencia', 'ES', 39.4699, -0.3763, 'Europe/Madrid', 45, NULL, NULL),
  ('Seville', 'ES', 37.3891, -5.9845, 'Europe/Madrid', 40, NULL, NULL),
  ('Bilbao', 'ES', 43.2630, -2.9350, 'Europe/Madrid', 35, NULL, NULL),

  -- Italy (IT)
  ('Rome', 'IT', 41.9028, 12.4964, 'Europe/Rome', 90, NULL, NULL),
  ('Milan', 'IT', 45.4642, 9.1900, 'Europe/Rome', 70, NULL, NULL),
  ('Naples', 'IT', 40.8518, 14.2681, 'Europe/Rome', 45, NULL, NULL),
  ('Florence', 'IT', 43.7696, 11.2558, 'Europe/Rome', 55, NULL, NULL),
  ('Venice', 'IT', 45.4408, 12.3155, 'Europe/Rome', 65, NULL, NULL),

  -- Netherlands (NL)
  ('Amsterdam', 'NL', 52.3676, 4.9041, 'Europe/Amsterdam', 80, NULL, NULL),
  ('Rotterdam', 'NL', 51.9244, 4.4777, 'Europe/Amsterdam', 45, NULL, NULL),
  ('The Hague', 'NL', 52.0705, 4.3007, 'Europe/Amsterdam', 40, NULL, NULL),
  ('Utrecht', 'NL', 52.0907, 5.1214, 'Europe/Amsterdam', 38, NULL, NULL),
  ('Eindhoven', 'NL', 51.4416, 5.4697, 'Europe/Amsterdam', 35, NULL, NULL),

  -- Switzerland (CH)
  ('Zurich', 'CH', 47.3769, 8.5417, 'Europe/Zurich', 60, NULL, NULL),
  ('Geneva', 'CH', 46.2044, 6.1432, 'Europe/Zurich', 55, NULL, NULL),
  ('Basel', 'CH', 47.5596, 7.5886, 'Europe/Zurich', 40, NULL, NULL),
  ('Lausanne', 'CH', 46.5197, 6.6323, 'Europe/Zurich', 38, NULL, NULL),
  ('Bern', 'CH', 46.9480, 7.4474, 'Europe/Zurich', 42, NULL, NULL),

  -- Sweden (SE)
  ('Stockholm', 'SE', 59.3293, 18.0686, 'Europe/Stockholm', 55, NULL, NULL),
  ('Gothenburg', 'SE', 57.7089, 11.9746, 'Europe/Stockholm', 40, NULL, NULL),
  ('Malmo', 'SE', 55.604981, 13.003822, 'Europe/Stockholm', 35, NULL, NULL),
  ('Uppsala', 'SE', 59.8586, 17.6389, 'Europe/Stockholm', 30, NULL, NULL),

  -- Norway (NO)
  ('Oslo', 'NO', 59.9139, 10.7522, 'Europe/Oslo', 45, NULL, NULL),
  ('Bergen', 'NO', 60.3913, 5.3221, 'Europe/Oslo', 35, NULL, NULL),
  ('Trondheim', 'NO', 63.4305, 10.3951, 'Europe/Oslo', 30, NULL, NULL),
  ('Stavanger', 'NO', 58.969975, 5.733107, 'Europe/Oslo', 28, NULL, NULL),

  -- Turkey (TR)
  ('Istanbul', 'TR', 41.0082, 28.9784, 'Europe/Istanbul', 85, NULL, NULL),
  ('Ankara', 'TR', 39.9334, 32.8597, 'Europe/Istanbul', 50, NULL, NULL),
  ('Izmir', 'TR', 38.4237, 27.1428, 'Europe/Istanbul', 40, NULL, NULL),
  ('Antalya', 'TR', 36.8969, 30.7133, 'Europe/Istanbul', 45, NULL, NULL),

  -- United Arab Emirates (AE)
  ('Dubai', 'AE', 25.2048, 55.2708, 'Asia/Dubai', 90, NULL, NULL),
  ('Abu Dhabi', 'AE', 24.4539, 54.3773, 'Asia/Dubai', 60, NULL, NULL),
  ('Sharjah', 'AE', 25.3463, 55.4209, 'Asia/Dubai', 35, NULL, NULL),

  -- South Africa (ZA)
  ('Johannesburg', 'ZA', -26.2041, 28.0473, 'Africa/Johannesburg', 55, NULL, NULL),
  ('Cape Town', 'ZA', -33.9249, 18.4241, 'Africa/Johannesburg', 65, NULL, NULL),
  ('Durban', 'ZA', -29.8587, 31.0218, 'Africa/Johannesburg', 40, NULL, NULL),
  ('Pretoria', 'ZA', -25.7479, 28.2293, 'Africa/Johannesburg', 35, NULL, NULL),

  -- Egypt (EG)
  ('Cairo', 'EG', 30.0444, 31.2357, 'Africa/Cairo', 70, NULL, NULL),
  ('Alexandria', 'EG', 31.2001, 29.9187, 'Africa/Cairo', 45, NULL, NULL),
  ('Giza', 'EG', 30.0131, 31.2089, 'Africa/Cairo', 40, NULL, NULL),
  ('Sharm El Sheikh', 'EG', 27.9158, 34.3305, 'Africa/Cairo', 35, NULL, NULL),

  -- Nigeria (NG)
  ('Lagos', 'NG', 6.5244, 3.3792, 'Africa/Lagos', 70, NULL, NULL),
  ('Abuja', 'NG', 9.0765, 7.3986, 'Africa/Lagos', 45, NULL, NULL),
  ('Ibadan', 'NG', 7.3775, 3.9470, 'Africa/Lagos', 30, NULL, NULL),
  ('Port Harcourt', 'NG', 4.8156, 7.0498, 'Africa/Lagos', 28, NULL, NULL),

  -- Kenya (KE)
  ('Nairobi', 'KE', -1.2921, 36.8219, 'Africa/Nairobi', 60, NULL, NULL),
  ('Mombasa', 'KE', -4.0435, 39.6682, 'Africa/Nairobi', 35, NULL, NULL),
  ('Kisumu', 'KE', -0.0917, 34.7680, 'Africa/Nairobi', 25, NULL, NULL),

  -- India (IN)
  ('Mumbai', 'IN', 19.0760, 72.8777, 'Asia/Kolkata', 95, NULL, NULL),
  ('Delhi', 'IN', 28.7041, 77.1025, 'Asia/Kolkata', 90, NULL, NULL),
  ('Bangalore', 'IN', 12.9716, 77.5946, 'Asia/Kolkata', 85, NULL, NULL),
  ('Hyderabad', 'IN', 17.3850, 78.4867, 'Asia/Kolkata', 70, NULL, NULL),
  ('Chennai', 'IN', 13.0827, 80.2707, 'Asia/Kolkata', 65, NULL, NULL),
  ('Kolkata', 'IN', 22.5726, 88.3639, 'Asia/Kolkata', 60, NULL, NULL),

  -- China (CN)
  ('Beijing', 'CN', 39.9042, 116.4074, 'Asia/Shanghai', 95, NULL, NULL),
  ('Shanghai', 'CN', 31.2304, 121.4737, 'Asia/Shanghai', 95, NULL, NULL),
  ('Guangzhou', 'CN', 23.1291, 113.2644, 'Asia/Shanghai', 80, NULL, NULL),
  ('Shenzhen', 'CN', 22.5431, 114.0579, 'Asia/Shanghai', 85, NULL, NULL),
  ('Chengdu', 'CN', 30.5728, 104.0668, 'Asia/Shanghai', 70, NULL, NULL),
  ('Xi''an', 'CN', 34.3416, 108.9398, 'Asia/Shanghai', 60, NULL, NULL),
  ('Wuhan', 'CN', 30.5928, 114.3055, 'Asia/Shanghai', 60, NULL, NULL),

  -- Japan (JP)
  ('Tokyo', 'JP', 35.6762, 139.6503, 'Asia/Tokyo', 100, NULL, NULL),
  ('Osaka', 'JP', 34.6937, 135.5023, 'Asia/Tokyo', 75, NULL, NULL),
  ('Kyoto', 'JP', 35.0116, 135.7681, 'Asia/Tokyo', 65, NULL, NULL),
  ('Yokohama', 'JP', 35.4437, 139.6380, 'Asia/Tokyo', 60, NULL, NULL),
  ('Sapporo', 'JP', 43.0618, 141.3545, 'Asia/Tokyo', 55, NULL, NULL),
  ('Nagoya', 'JP', 35.1815, 136.9066, 'Asia/Tokyo', 60, NULL, NULL),

  -- South Korea (KR)
  ('Seoul', 'KR', 37.5665, 126.9780, 'Asia/Seoul', 95, NULL, NULL),
  ('Busan', 'KR', 35.1796, 129.0756, 'Asia/Seoul', 70, NULL, NULL),
  ('Incheon', 'KR', 37.4563, 126.7052, 'Asia/Seoul', 55, NULL, NULL),
  ('Daegu', 'KR', 35.8722, 128.6025, 'Asia/Seoul', 45, NULL, NULL),

  -- Singapore (SG)
  ('Singapore', 'SG', 1.3521, 103.8198, 'Asia/Singapore', 85, NULL, NULL),

  -- Indonesia (ID)
  ('Jakarta', 'ID', -6.2088, 106.8456, 'Asia/Jakarta', 80, NULL, NULL),
  ('Surabaya', 'ID', -7.2575, 112.7521, 'Asia/Jakarta', 50, NULL, NULL),
  ('Bandung', 'ID', -6.9175, 107.6191, 'Asia/Jakarta', 45, NULL, NULL),
  ('Denpasar', 'ID', -8.6705, 115.2126, 'Asia/Makassar', 60, NULL, NULL),

  -- Australia (AU)
  ('Sydney', 'AU', -33.8688, 151.2093, 'Australia/Sydney', 95, NULL, NULL),
  ('Melbourne', 'AU', -37.8136, 144.9631, 'Australia/Melbourne', 90, NULL, NULL),
  ('Brisbane', 'AU', -27.4698, 153.0251, 'Australia/Brisbane', 65, NULL, NULL),
  ('Perth', 'AU', -31.9505, 115.8605, 'Australia/Perth', 55, NULL, NULL),
  ('Adelaide', 'AU', -34.9285, 138.6007, 'Australia/Adelaide', 50, NULL, NULL),

  -- New Zealand (NZ)
  ('Auckland', 'NZ', -36.8485, 174.7633, 'Pacific/Auckland', 60, NULL, NULL),
  ('Wellington', 'NZ', -41.2866, 174.7756, 'Pacific/Auckland', 45, NULL, NULL),
  ('Christchurch', 'NZ', -43.5321, 172.6362, 'Pacific/Auckland', 40, NULL, NULL),
  ('Queenstown', 'NZ', -45.0312, 168.6626, 'Pacific/Auckland', 35, NULL, NULL),

  -- Additional United States cities
  ('Seattle', 'US', 47.6062, -122.3321, 'America/Los_Angeles', 70, NULL, NULL),
  ('Boston', 'US', 42.3601, -71.0589, 'America/New_York', 68, NULL, NULL),
  ('Washington', 'US', 38.9072, -77.0369, 'America/New_York', 72, NULL, NULL),
  ('Philadelphia', 'US', 39.9526, -75.1652, 'America/New_York', 60, NULL, NULL),
  ('Atlanta', 'US', 33.7490, -84.3880, 'America/New_York', 62, NULL, NULL),
  ('Dallas', 'US', 32.7767, -96.7970, 'America/Chicago', 58, NULL, NULL),
  ('Las Vegas', 'US', 36.1699, -115.1398, 'America/Los_Angeles', 65, NULL, NULL),

  -- Additional Canada cities
  ('Edmonton', 'CA', 53.5461, -113.4938, 'America/Edmonton', 32, NULL, NULL),
  ('Quebec City', 'CA', 46.8139, -71.2080, 'America/Toronto', 30, NULL, NULL),
  ('Halifax', 'CA', 44.6488, -63.5752, 'America/Halifax', 28, NULL, NULL),
  ('Winnipeg', 'CA', 49.8951, -97.1384, 'America/Winnipeg', 29, NULL, NULL),

  -- Additional Mexico cities
  ('Puebla', 'MX', 19.0414, -98.2063, 'America/Mexico_City', 35, NULL, NULL),
  ('Merida', 'MX', 20.9674, -89.5926, 'America/Merida', 34, NULL, NULL),
  ('Oaxaca', 'MX', 17.0732, -96.7266, 'America/Mexico_City', 30, NULL, NULL),

  -- Additional Brazil cities
  ('Curitiba', 'BR', -25.4284, -49.2733, 'America/Sao_Paulo', 38, NULL, NULL),
  ('Fortaleza', 'BR', -3.7319, -38.5267, 'America/Fortaleza', 36, NULL, NULL),
  ('Recife', 'BR', -8.0476, -34.8770, 'America/Recife', 34, NULL, NULL),
  ('Manaus', 'BR', -3.1190, -60.0217, 'America/Manaus', 33, NULL, NULL),

  -- Additional Argentina cities
  ('Mar del Plata', 'AR', -38.0055, -57.5426, 'America/Argentina/Buenos_Aires', 28, NULL, NULL),
  ('San Carlos de Bariloche', 'AR', -41.1335, -71.3103, 'America/Argentina/Salta', 26, NULL, NULL),

  -- Additional United Kingdom cities
  ('Leeds', 'GB', 53.8008, -1.5491, 'Europe/London', 32, NULL, NULL),
  ('Liverpool', 'GB', 53.4084, -2.9916, 'Europe/London', 34, NULL, NULL),
  ('Bristol', 'GB', 51.4545, -2.5879, 'Europe/London', 33, NULL, NULL),
  ('Oxford', 'GB', 51.7520, -1.2577, 'Europe/London', 25, NULL, NULL),
  ('Cambridge', 'GB', 52.2053, 0.1218, 'Europe/London', 24, NULL, NULL),

  -- Additional France cities
  ('Bordeaux', 'FR', 44.8378, -0.5792, 'Europe/Paris', 40, NULL, NULL),
  ('Lille', 'FR', 50.6292, 3.0573, 'Europe/Paris', 38, NULL, NULL),
  ('Strasbourg', 'FR', 48.5734, 7.7521, 'Europe/Paris', 36, NULL, NULL),
  ('Nantes', 'FR', 47.2184, -1.5536, 'Europe/Paris', 35, NULL, NULL),
  ('Cannes', 'FR', 43.5528, 7.0174, 'Europe/Paris', 34, NULL, NULL),

  -- Additional Germany cities
  ('Dusseldorf', 'DE', 51.2277, 6.7735, 'Europe/Berlin', 40, NULL, NULL),
  ('Stuttgart', 'DE', 48.7758, 9.1829, 'Europe/Berlin', 45, NULL, NULL),
  ('Dresden', 'DE', 51.0504, 13.7373, 'Europe/Berlin', 35, NULL, NULL),
  ('Leipzig', 'DE', 51.3397, 12.3731, 'Europe/Berlin', 34, NULL, NULL),

  -- Additional Spain cities
  ('Granada', 'ES', 37.1773, -3.5986, 'Europe/Madrid', 32, NULL, NULL),
  ('Malaga', 'ES', 36.7213, -4.4214, 'Europe/Madrid', 40, NULL, NULL),
  ('Zaragoza', 'ES', 41.6488, -0.8891, 'Europe/Madrid', 30, NULL, NULL),
  ('Palma de Mallorca', 'ES', 39.5696, 2.6502, 'Europe/Madrid', 33, NULL, NULL),
  ('Alicante', 'ES', 38.3452, -0.4815, 'Europe/Madrid', 31, NULL, NULL),

  -- Additional Italy cities
  ('Turin', 'IT', 45.0703, 7.6869, 'Europe/Rome', 48, NULL, NULL),
  ('Bologna', 'IT', 44.4949, 11.3426, 'Europe/Rome', 46, NULL, NULL),
  ('Verona', 'IT', 45.4384, 10.9916, 'Europe/Rome', 42, NULL, NULL),
  ('Palermo', 'IT', 38.1157, 13.3615, 'Europe/Rome', 40, NULL, NULL),
  ('Catania', 'IT', 37.5079, 15.0830, 'Europe/Rome', 38, NULL, NULL),

  -- Additional Netherlands cities
  ('Haarlem', 'NL', 52.3874, 4.6462, 'Europe/Amsterdam', 28, NULL, NULL),
  ('Groningen', 'NL', 53.2194, 6.5665, 'Europe/Amsterdam', 27, NULL, NULL),

  -- Additional Switzerland cities
  ('Lucerne', 'CH', 47.0502, 8.3093, 'Europe/Zurich', 34, NULL, NULL),
  ('Interlaken', 'CH', 46.6863, 7.8632, 'Europe/Zurich', 30, NULL, NULL),
  ('Lugano', 'CH', 46.0037, 8.9511, 'Europe/Zurich', 29, NULL, NULL),

  -- Additional Sweden cities
  ('Linkoping', 'SE', 58.4109, 15.6216, 'Europe/Stockholm', 24, NULL, NULL),

  -- Additional Norway cities
  ('Tromso', 'NO', 69.6492, 18.9553, 'Europe/Oslo', 22, NULL, NULL),

  -- Additional Turkey cities
  ('Bursa', 'TR', 40.1950, 29.0600, 'Europe/Istanbul', 34, NULL, NULL),
  ('Konya', 'TR', 37.8746, 32.4932, 'Europe/Istanbul', 30, NULL, NULL),

  -- Additional UAE cities
  ('Al Ain', 'AE', 24.1302, 55.8023, 'Asia/Dubai', 22, NULL, NULL),
  ('Ras Al Khaimah', 'AE', 25.8007, 55.9762, 'Asia/Dubai', 20, NULL, NULL),

  -- Additional South Africa cities
  ('Gqeberha', 'ZA', -33.9608, 25.6022, 'Africa/Johannesburg', 26, NULL, NULL),
  ('Bloemfontein', 'ZA', -29.0852, 26.1596, 'Africa/Johannesburg', 24, NULL, NULL),

  -- Additional Egypt cities
  ('Luxor', 'EG', 25.6872, 32.6396, 'Africa/Cairo', 28, NULL, NULL),
  ('Aswan', 'EG', 24.0889, 32.8998, 'Africa/Cairo', 24, NULL, NULL),
  ('Hurghada', 'EG', 27.2579, 33.8116, 'Africa/Cairo', 26, NULL, NULL),

  -- Additional Nigeria cities
  ('Kano', 'NG', 12.0022, 8.5920, 'Africa/Lagos', 26, NULL, NULL),
  ('Benin City', 'NG', 6.3350, 5.6037, 'Africa/Lagos', 22, NULL, NULL),

  -- Additional Kenya cities
  ('Nakuru', 'KE', -0.3031, 36.0800, 'Africa/Nairobi', 22, NULL, NULL),
  ('Eldoret', 'KE', 0.5143, 35.2698, 'Africa/Nairobi', 20, NULL, NULL),

  -- Additional India cities
  ('Pune', 'IN', 18.5204, 73.8567, 'Asia/Kolkata', 70, NULL, NULL),
  ('Ahmedabad', 'IN', 23.0225, 72.5714, 'Asia/Kolkata', 65, NULL, NULL),
  ('Jaipur', 'IN', 26.9124, 75.7873, 'Asia/Kolkata', 60, NULL, NULL),
  ('Surat', 'IN', 21.1702, 72.8311, 'Asia/Kolkata', 50, NULL, NULL),
  ('Lucknow', 'IN', 26.8467, 80.9462, 'Asia/Kolkata', 48, NULL, NULL),
  ('Kochi', 'IN', 9.9312, 76.2673, 'Asia/Kolkata', 45, NULL, NULL),
  ('Varanasi', 'IN', 25.3176, 82.9739, 'Asia/Kolkata', 44, NULL, NULL),
  ('Chandigarh', 'IN', 30.7333, 76.7794, 'Asia/Kolkata', 40, NULL, NULL),

  -- Additional China cities
  ('Tianjin', 'CN', 39.3434, 117.3616, 'Asia/Shanghai', 60, NULL, NULL),
  ('Chongqing', 'CN', 29.5630, 106.5516, 'Asia/Shanghai', 60, NULL, NULL),
  ('Hangzhou', 'CN', 30.2741, 120.1551, 'Asia/Shanghai', 58, NULL, NULL),
  ('Nanjing', 'CN', 32.0603, 118.7969, 'Asia/Shanghai', 55, NULL, NULL),
  ('Suzhou', 'CN', 31.2983, 120.5832, 'Asia/Shanghai', 54, NULL, NULL),
  ('Harbin', 'CN', 45.8038, 126.5349, 'Asia/Shanghai', 45, NULL, NULL),
  ('Qingdao', 'CN', 36.0671, 120.3826, 'Asia/Shanghai', 48, NULL, NULL),
  ('Dalian', 'CN', 38.9140, 121.6147, 'Asia/Shanghai', 46, NULL, NULL),

  -- Additional Japan cities
  ('Hiroshima', 'JP', 34.3853, 132.4553, 'Asia/Tokyo', 48, NULL, NULL),
  ('Fukuoka', 'JP', 33.5902, 130.4017, 'Asia/Tokyo', 50, NULL, NULL),
  ('Kobe', 'JP', 34.6901, 135.1955, 'Asia/Tokyo', 46, NULL, NULL),
  ('Nara', 'JP', 34.6851, 135.8048, 'Asia/Tokyo', 40, NULL, NULL),
  ('Kanazawa', 'JP', 36.5613, 136.6562, 'Asia/Tokyo', 38, NULL, NULL),

  -- Additional South Korea cities
  ('Gwangju', 'KR', 35.1595, 126.8526, 'Asia/Seoul', 38, NULL, NULL),
  ('Daejeon', 'KR', 36.3504, 127.3845, 'Asia/Seoul', 36, NULL, NULL),
  ('Ulsan', 'KR', 35.5384, 129.3114, 'Asia/Seoul', 34, NULL, NULL),
  ('Suwon', 'KR', 37.2636, 127.0286, 'Asia/Seoul', 32, NULL, NULL),

  -- Additional Indonesia cities
  ('Yogyakarta', 'ID', -7.7956, 110.3695, 'Asia/Jakarta', 40, NULL, NULL),
  ('Medan', 'ID', 3.5952, 98.6722, 'Asia/Jakarta', 35, NULL, NULL),
  ('Makassar', 'ID', -5.1477, 119.4327, 'Asia/Makassar', 35, NULL, NULL),
  ('Semarang', 'ID', -6.9667, 110.4167, 'Asia/Jakarta', 32, NULL, NULL),
  ('Batam', 'ID', 1.0456, 104.0305, 'Asia/Jakarta', 30, NULL, NULL),

  -- Additional Australia cities
  ('Gold Coast', 'AU', -28.0167, 153.4000, 'Australia/Brisbane', 45, NULL, NULL),
  ('Canberra', 'AU', -35.2809, 149.1300, 'Australia/Sydney', 40, NULL, NULL),
  ('Hobart', 'AU', -42.8821, 147.3272, 'Australia/Hobart', 35, NULL, NULL),
  ('Darwin', 'AU', -12.4634, 130.8456, 'Australia/Darwin', 34, NULL, NULL),

  -- Additional New Zealand cities
  ('Hamilton', 'NZ', -37.7870, 175.2793, 'Pacific/Auckland', 30, NULL, NULL),
  ('Tauranga', 'NZ', -37.6878, 176.1651, 'Pacific/Auckland', 28, NULL, NULL),
  ('Dunedin', 'NZ', -45.8788, 170.5028, 'Pacific/Auckland', 26, NULL, NULL),

  -- Portugal (PT)
  ('Lisbon', 'PT', 38.7223, -9.1393, 'Europe/Lisbon', 75, NULL, NULL),
  ('Porto', 'PT', 41.1579, -8.6291, 'Europe/Lisbon', 60, NULL, NULL),
  ('Faro', 'PT', 37.0194, -7.9304, 'Europe/Lisbon', 40, NULL, NULL),

  -- Greece (GR)
  ('Athens', 'GR', 37.9838, 23.7275, 'Europe/Athens', 70, NULL, NULL),
  ('Thessaloniki', 'GR', 40.6401, 22.9444, 'Europe/Athens', 50, NULL, NULL),
  ('Heraklion', 'GR', 35.3387, 25.1442, 'Europe/Athens', 45, NULL, NULL),

  -- Thailand (TH)
  ('Bangkok', 'TH', 13.7563, 100.5018, 'Asia/Bangkok', 90, NULL, NULL),
  ('Chiang Mai', 'TH', 18.7061, 98.9817, 'Asia/Bangkok', 55, NULL, NULL),
  ('Phuket', 'TH', 7.8804, 98.3923, 'Asia/Bangkok', 60, NULL, NULL),
  ('Pattaya', 'TH', 12.9236, 100.8825, 'Asia/Bangkok', 45, NULL, NULL),

  -- Vietnam (VN)
  ('Hanoi', 'VN', 21.0278, 105.8342, 'Asia/Ho_Chi_Minh', 70, NULL, NULL),
  ('Ho Chi Minh City', 'VN', 10.8231, 106.6297, 'Asia/Ho_Chi_Minh', 85, NULL, NULL),
  ('Da Nang', 'VN', 16.0544, 108.2022, 'Asia/Ho_Chi_Minh', 55, NULL, NULL),
  ('Hue', 'VN', 16.4637, 107.5909, 'Asia/Ho_Chi_Minh', 40, NULL, NULL),

  -- Philippines (PH)
  ('Manila', 'PH', 14.5995, 120.9842, 'Asia/Manila', 85, NULL, NULL),
  ('Cebu', 'PH', 10.3157, 123.8854, 'Asia/Manila', 55, NULL, NULL),
  ('Davao', 'PH', 7.1907, 125.4553, 'Asia/Manila', 50, NULL, NULL),

  -- Malaysia (MY)
  ('Kuala Lumpur', 'MY', 3.1390, 101.6869, 'Asia/Kuala_Lumpur', 75, NULL, NULL),
  ('George Town', 'MY', 5.4141, 100.3288, 'Asia/Kuala_Lumpur', 50, NULL, NULL),
  ('Johor Bahru', 'MY', 1.4927, 103.7414, 'Asia/Kuala_Lumpur', 45, NULL, NULL),

  -- Saudi Arabia (SA)
  ('Riyadh', 'SA', 24.7136, 46.6753, 'Asia/Riyadh', 65, NULL, NULL),
  ('Jeddah', 'SA', 21.4858, 39.1925, 'Asia/Riyadh', 60, NULL, NULL),
  ('Dammam', 'SA', 26.4207, 50.0888, 'Asia/Riyadh', 45, NULL, NULL),

  -- Qatar (QA)
  ('Doha', 'QA', 25.2854, 51.5310, 'Asia/Qatar', 60, NULL, NULL),

  -- Israel (IL)
  ('Tel Aviv', 'IL', 32.0853, 34.7818, 'Asia/Jerusalem', 70, NULL, NULL),
  ('Jerusalem', 'IL', 31.7683, 35.2137, 'Asia/Jerusalem', 65, NULL, NULL),
  ('Haifa', 'IL', 32.7940, 34.9896, 'Asia/Jerusalem', 45, NULL, NULL),

  -- Morocco (MA)
  ('Casablanca', 'MA', 33.5731, -7.5898, 'Africa/Casablanca', 60, NULL, NULL),
  ('Marrakech', 'MA', 31.6295, -7.9811, 'Africa/Casablanca', 55, NULL, NULL),
  ('Fes', 'MA', 34.0333, -5.0000, 'Africa/Casablanca', 40, NULL, NULL),

  -- Colombia (CO)
  ('Bogota', 'CO', 4.7110, -74.0721, 'America/Bogota', 70, NULL, NULL),
  ('Medellin', 'CO', 6.2442, -75.5812, 'America/Bogota', 55, NULL, NULL),
  ('Cartagena', 'CO', 10.3910, -75.4794, 'America/Bogota', 50, NULL, NULL),

  -- Peru (PE)
  ('Lima', 'PE', -12.0464, -77.0428, 'America/Lima', 70, NULL, NULL),
  ('Cusco', 'PE', -13.5319, -71.9675, 'America/Lima', 55, NULL, NULL),
  ('Arequipa', 'PE', -16.4090, -71.5375, 'America/Lima', 45, NULL, NULL),

  -- Chile (CL)
  ('Santiago', 'CL', -33.4489, -70.6693, 'America/Santiago', 75, NULL, NULL),
  ('Valparaiso', 'CL', -33.0472, -71.6127, 'America/Santiago', 45, NULL, NULL)
),
country_map AS (
  SELECT id, code FROM countries
)
INSERT INTO cities (
  name,
  country_id,
  latitude,
  longitude,
  timezone,
  popularity,
  description,
  image_url,
  created_at,
  updated_at
)
SELECT
  nc.name,
  cm.id AS country_id,
  nc.latitude,
  nc.longitude,
  nc.timezone,
  nc.popularity,
  nc.description,
  nc.image_url,
  NOW(),
  NOW()
FROM new_cities nc
JOIN country_map cm ON cm.code = nc.country_code
LEFT JOIN cities existing
  ON existing.name = nc.name AND existing.country_id = cm.id
WHERE existing.id IS NULL;

COMMIT;


