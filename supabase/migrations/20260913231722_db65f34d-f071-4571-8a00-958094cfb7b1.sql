DROP FUNCTION IF EXISTS public.lantern_clinical_queue(text, integer, integer);

CREATE FUNCTION public.lantern_clinical_queue(p_status text DEFAULT NULL, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id text, name text, age integer, pronouns text, diagnosis text, pathway text,
  region text, team text, status text, score integer, reason text,
  heart_rate integer, spo2 integer, respiratory_rate integer, systolic_bp integer,
  temperature numeric, last_observation text, owner text, total bigint
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
  SELECT b.id, b.name, b.age, b.pronouns, b.diagnosis, b.pathway, b.region, b.team,
         b.status, b.score, b.reason, b.heart_rate, b.spo2, b.respiratory_rate,
         b.systolic_bp, b.temperature, b.last_observation, b.owner,
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