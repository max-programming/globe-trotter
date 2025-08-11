-- Custom SQL migration file, put your code below! ---- Update countries.currency using ISO 4217 codes
-- Idempotent: only updates when value differs

BEGIN;

WITH currency_map(code, currency) AS (
  VALUES
    -- North America
    ('US', 'USD'),
    ('CA', 'CAD'),
    ('MX', 'MXN'),

    -- South America
    ('BR', 'BRL'),
    ('AR', 'ARS'),
    ('CO', 'COP'),
    ('PE', 'PEN'),
    ('CL', 'CLP'),

    -- Europe
    ('GB', 'GBP'),
    ('FR', 'EUR'),
    ('DE', 'EUR'),
    ('ES', 'EUR'),
    ('IT', 'EUR'),
    ('NL', 'EUR'),
    ('CH', 'CHF'),
    ('SE', 'SEK'),
    ('NO', 'NOK'),
    ('TR', 'TRY'),
    ('PT', 'EUR'),
    ('GR', 'EUR'),

    -- Middle East & Africa
    ('AE', 'AED'),
    ('SA', 'SAR'),
    ('QA', 'QAR'),
    ('IL', 'ILS'),
    ('MA', 'MAD'),
    ('ZA', 'ZAR'),
    ('EG', 'EGP'),
    ('NG', 'NGN'),
    ('KE', 'KES'),

    -- Asia
    ('IN', 'INR'),
    ('CN', 'CNY'),
    ('JP', 'JPY'),
    ('KR', 'KRW'),
    ('SG', 'SGD'),
    ('ID', 'IDR'),
    ('TH', 'THB'),
    ('VN', 'VND'),
    ('PH', 'PHP'),
    ('MY', 'MYR'),

    -- Oceania
    ('AU', 'AUD'),
    ('NZ', 'NZD')
)
UPDATE countries c
SET currency = cm.currency,
    updated_at = NOW()
FROM currency_map cm
WHERE c.code = cm.code
  AND (c.currency IS DISTINCT FROM cm.currency);

COMMIT;


