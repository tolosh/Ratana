ALTER TABLE public.lantern_network_snapshots
  ADD COLUMN IF NOT EXISTS active_patients integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupancy_percent integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS admissions_pending integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfers_in_progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staffing_pressure_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_pressure text NOT NULL DEFAULT 'steady',
  ADD COLUMN IF NOT EXISTS staffing_headroom text NOT NULL DEFAULT 'adequate',
  ADD COLUMN IF NOT EXISTS workload_forecast_4h integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workload_forecast_8h integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workload_forecast_24h integer NOT NULL DEFAULT 0;

ALTER TABLE public.lantern_network_snapshots
  ADD CONSTRAINT lantern_network_snapshots_occupancy_always_full CHECK (occupancy_percent = 100);

DELETE FROM public.lantern_network_snapshots WHERE region IS NOT NULL;

ALTER TABLE public.lantern_network_snapshots
  DROP COLUMN capacity,
  DROP COLUMN occupied;

INSERT INTO public.lantern_network_snapshots
  (region, active_patients, occupancy_percent, stable, clinical_review, rapid_response, no_data,
   admissions, admissions_pending, likely_discharges, transfers, transfers_in_progress,
   workload_percent, staffing_pressure_percent, service_pressure, staffing_headroom,
   workload_forecast_4h, workload_forecast_8h, workload_forecast_24h, device_concerns)
VALUES
  ('Metro North', 1050, 100, 630, 210, 74, 84, 41, 16, 44, 12, 5, 86, 86, 'strained', 'limited', 268, 402, 918, 82),
  ('Metro South', 950, 100, 570, 190, 67, 76, 37, 14, 40, 11, 4, 91, 91, 'strained', 'limited', 249, 371, 842, 74),
  ('Western Region', 800, 100, 480, 160, 56, 64, 31, 11, 33, 9, 3, 74, 74, 'steady', 'adequate', 196, 297, 683, 61),
  ('Regional Coastal', 700, 100, 420, 140, 49, 56, 27, 10, 29, 8, 3, 78, 78, 'steady', 'adequate', 174, 261, 597, 58),
  ('Regional Inland', 600, 100, 360, 120, 42, 48, 23, 8, 25, 6, 2, 82, 82, 'strained', 'limited', 151, 226, 512, 71),
  ('Hospital Partner Network', 900, 100, 540, 180, 63, 72, 35, 13, 38, 10, 4, 88, 88, 'strained', 'limited', 232, 349, 796, 79);