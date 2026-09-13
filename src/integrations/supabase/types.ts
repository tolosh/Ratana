export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lantern_enquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          organisation: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          organisation?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          organisation?: string | null
        }
        Relationships: []
      }
      lantern_network_snapshots: {
        Row: {
          active_patients: number
          admissions: number
          admissions_pending: number
          clinical_review: number
          created_at: string
          device_concerns: number
          id: string
          likely_discharges: number
          no_data: number
          occupancy_percent: number
          rapid_response: number
          region: string
          service_pressure: string
          stable: number
          staffing_headroom: string
          staffing_pressure_percent: number
          transfers: number
          transfers_in_progress: number
          updated_at: string
          workload_forecast_24h: number
          workload_forecast_4h: number
          workload_forecast_8h: number
          workload_percent: number
        }
        Insert: {
          active_patients?: number
          admissions: number
          admissions_pending?: number
          clinical_review: number
          created_at?: string
          device_concerns: number
          id?: string
          likely_discharges: number
          no_data: number
          occupancy_percent?: number
          rapid_response: number
          region: string
          service_pressure?: string
          stable: number
          staffing_headroom?: string
          staffing_pressure_percent?: number
          transfers: number
          transfers_in_progress?: number
          updated_at?: string
          workload_forecast_24h?: number
          workload_forecast_4h?: number
          workload_forecast_8h?: number
          workload_percent: number
        }
        Update: {
          active_patients?: number
          admissions?: number
          admissions_pending?: number
          clinical_review?: number
          created_at?: string
          device_concerns?: number
          id?: string
          likely_discharges?: number
          no_data?: number
          occupancy_percent?: number
          rapid_response?: number
          region?: string
          service_pressure?: string
          stable?: number
          staffing_headroom?: string
          staffing_pressure_percent?: number
          transfers?: number
          transfers_in_progress?: number
          updated_at?: string
          workload_forecast_24h?: number
          workload_forecast_4h?: number
          workload_forecast_8h?: number
          workload_percent?: number
        }
        Relationships: []
      }
      lantern_patients: {
        Row: {
          admission_stage: string | null
          age: number
          created_at: string
          device_concern: boolean
          device_data_age_minutes: number | null
          device_issue: string | null
          device_next_action: string | null
          device_owner: string | null
          device_type: string | null
          diagnosis: string
          discharge_ready: boolean
          episode_state: string
          heart_rate: number | null
          id: string
          last_observation: string
          name: string
          owner: string
          pathway: string
          pronouns: string
          reason: string
          referred_at: string | null
          region: string
          respiratory_rate: number | null
          score: number
          spo2: number | null
          status: string
          systolic_bp: number | null
          team: string
          temperature: number | null
          transfer_destination: string | null
          transfer_eta: string | null
          transfer_in_progress: boolean
          transfer_stage: string | null
          updated_at: string
        }
        Insert: {
          admission_stage?: string | null
          age: number
          created_at?: string
          device_concern?: boolean
          device_data_age_minutes?: number | null
          device_issue?: string | null
          device_next_action?: string | null
          device_owner?: string | null
          device_type?: string | null
          diagnosis: string
          discharge_ready?: boolean
          episode_state?: string
          heart_rate?: number | null
          id: string
          last_observation: string
          name: string
          owner: string
          pathway: string
          pronouns: string
          reason: string
          referred_at?: string | null
          region: string
          respiratory_rate?: number | null
          score: number
          spo2?: number | null
          status: string
          systolic_bp?: number | null
          team: string
          temperature?: number | null
          transfer_destination?: string | null
          transfer_eta?: string | null
          transfer_in_progress?: boolean
          transfer_stage?: string | null
          updated_at?: string
        }
        Update: {
          admission_stage?: string | null
          age?: number
          created_at?: string
          device_concern?: boolean
          device_data_age_minutes?: number | null
          device_issue?: string | null
          device_next_action?: string | null
          device_owner?: string | null
          device_type?: string | null
          diagnosis?: string
          discharge_ready?: boolean
          episode_state?: string
          heart_rate?: number | null
          id?: string
          last_observation?: string
          name?: string
          owner?: string
          pathway?: string
          pronouns?: string
          reason?: string
          referred_at?: string | null
          region?: string
          respiratory_rate?: number | null
          score?: number
          spo2?: number | null
          status?: string
          systolic_bp?: number | null
          team?: string
          temperature?: number | null
          transfer_destination?: string | null
          transfer_eta?: string | null
          transfer_in_progress?: boolean
          transfer_stage?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lantern_role_assignments: {
        Row: {
          created_at: string
          display_name: string
          expires_at: string | null
          id: string
          organization: string
          region: string | null
          role: string
          team: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          expires_at?: string | null
          id?: string
          organization: string
          region?: string | null
          role: string
          team?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          expires_at?: string | null
          id?: string
          organization?: string
          region?: string | null
          role?: string
          team?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lantern_scenarios: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          id: string
          name: string
          patient_id: string | null
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          duration_minutes: number
          id: string
          name: string
          patient_id?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          name?: string
          patient_id?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lantern_scenarios_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "lantern_patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      lantern_admission_worklist: {
        Args: never
        Returns: {
          id: string
          name: string
          owner: string
          pathway: string
          referred_at: string
          region: string
          stage: string
        }[]
      }
      lantern_clinical_queue: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: {
          id: string
          last_observation: string
          name: string
          owner: string
          pathway: string
          reason: string
          region: string
          respiratory_rate: number
          score: number
          spo2: number
          status: string
          total: number
        }[]
      }
      lantern_device_worklist: {
        Args: never
        Returns: {
          data_age_minutes: number
          device_type: string
          id: string
          issue: string
          name: string
          next_action: string
          owner: string
          status: string
        }[]
      }
      lantern_transfer_worklist: {
        Args: never
        Returns: {
          destination: string
          eta: string
          id: string
          name: string
          owner: string
          reason: string
          stage: string
          status: string
        }[]
      }
      lantern_worklist_summary: {
        Args: never
        Returns: {
          bucket: string
          kind: string
          total: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
