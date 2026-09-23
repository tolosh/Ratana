import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ScribeAccount = {
  userId: string;
  email: string | null;
  membership: { role: string; organisation_id: string } | null;
  org: { id: string; name: string; type: string; plan: string; country: string; audio_retention: string } | null;
  clinician: { full_name: string; profession: string; registration_body: string; registration_number: string; verification_status: string } | null;
  aal: string | null;
  hasFactor: boolean;
};

export function useScribeAccount() {
  return useQuery({
    queryKey: ["scribe-account"],
    queryFn: async (): Promise<ScribeAccount | null> => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return null;
      const [{ data: m }, { data: c }, { data: aal }, { data: factors }] = await Promise.all([
        supabase.from("memberships").select("role,organisation_id,organisations(id,name,type,plan,country,audio_retention)").eq("user_id", user.id).eq("status", "active").order("created_at").limit(1).maybeSingle(),
        supabase.from("clinicians").select("full_name,profession,registration_body,registration_number,verification_status").eq("user_id", user.id).maybeSingle(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      const org = (m as unknown as { organisations: ScribeAccount["org"] } | null)?.organisations ?? null;
      return {
        userId: user.id,
        email: user.email ?? null,
        membership: m ? { role: m.role, organisation_id: m.organisation_id } : null,
        org,
        clinician: c ?? null,
        aal: aal?.currentLevel ?? null,
        hasFactor: (factors?.totp ?? []).some((f) => f.status === "verified"),
      };
    },
    staleTime: 30_000,
  });
}
