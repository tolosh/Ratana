CREATE OR REPLACE FUNCTION public.lantern_clinical_queue(p_status text DEFAULT NULL, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id text, name text, pathway text, region text, status text, score integer,
  reason text, spo2 integer, respiratory_rate integer, last_observation text,
  owner text, total bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH base AS (
    SELECT p.*
    FROM public.lantern_patients p
    WHERE p.episode_state = 'active'
      AND (p_status IS NULL OR p.status = p_status)
  )
  SELECT b.id, b.name, b.pathway, b.region, b.status, b.score, b.reason,
         b.spo2, b.respiratory_rate, b.last_observation, b.owner,
         (SELECT count(*) FROM base) AS total
  FROM base b
  ORDER BY
    CASE b.status WHEN 'rapid' THEN 0 WHEN 'review' THEN 1 WHEN 'nodata' THEN 2 ELSE 3 END,
    b.score DESC,
    b.id
  LIMIT greatest(1, least(coalesce(p_limit, 25), 100))
  OFFSET greatest(0, coalesce(p_offset, 0))
$$;

GRANT EXECUTE ON FUNCTION public.lantern_clinical_queue(text, integer, integer) TO anon, authenticated;