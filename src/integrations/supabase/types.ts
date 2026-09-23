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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          at: string
          detail: Json
          entity_id: string | null
          entity_type: string
          id: string
          organisation_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string
          detail?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          organisation_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string
          detail?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          created_at: string
          full_name: string
          profession: string
          registration_body: string
          registration_number: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          full_name: string
          profession: string
          registration_body: string
          registration_number: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          profession?: string
          registration_body?: string
          registration_number?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
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
      memberships: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          role: string
          status: string
          supervisor_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          role: string
          status?: string
          supervisor_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          role?: string
          status?: string
          supervisor_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_modules: {
        Row: {
          enabled: boolean
          module: string
          organisation_id: string
        }
        Insert: {
          enabled?: boolean
          module: string
          organisation_id: string
        }
        Update: {
          enabled?: boolean
          module?: string
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_modules_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          audio_retention: string
          country: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          plan: string
          type: string
          updated_at: string
        }
        Insert: {
          audio_retention?: string
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          plan?: string
          type?: string
          updated_at?: string
        }
        Update: {
          audio_retention?: string
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          plan?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_addenda: {
        Row: {
          author_id: string
          author_name: string
          created_at: string
          id: string
          note_id: string
          organisation_id: string
          text: string
        }
        Insert: {
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          note_id: string
          organisation_id: string
          text: string
        }
        Update: {
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          note_id?: string
          organisation_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_addenda_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "scribe_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_addenda_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_audio_chunks: {
        Row: {
          bytes: number
          deleted_at: string | null
          id: string
          organisation_id: string
          seq: number
          session_id: string
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          bytes?: number
          deleted_at?: string | null
          id?: string
          organisation_id: string
          seq: number
          session_id: string
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          bytes?: number
          deleted_at?: string | null
          id?: string
          organisation_id?: string
          seq?: number
          session_id?: string
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_audio_chunks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_audio_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scribe_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_consents: {
        Row: {
          captured_at: string
          captured_by: string
          id: string
          organisation_id: string
          script_text: string
          script_version: string
          session_id: string
        }
        Insert: {
          captured_at?: string
          captured_by: string
          id?: string
          organisation_id: string
          script_text: string
          script_version: string
          session_id: string
        }
        Update: {
          captured_at?: string
          captured_by?: string
          id?: string
          organisation_id?: string
          script_text?: string
          script_version?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_consents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_consents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "scribe_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_notes: {
        Row: {
          consent_statement: string | null
          created_at: string
          generated_at: string | null
          id: string
          model: string | null
          organisation_id: string
          session_id: string
          signed_at: string | null
          signed_by: string | null
          signed_name: string | null
          status: string
          template_id: string
        }
        Insert: {
          consent_statement?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          model?: string | null
          organisation_id: string
          session_id: string
          signed_at?: string | null
          signed_by?: string | null
          signed_name?: string | null
          status?: string
          template_id: string
        }
        Update: {
          consent_statement?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          model?: string | null
          organisation_id?: string
          session_id?: string
          signed_at?: string | null
          signed_by?: string | null
          signed_name?: string | null
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_notes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "scribe_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_segments: {
        Row: {
          created_at: string
          id: string
          kind: string
          organisation_id: string
          seq: number
          session_id: string
          speaker: string
          t_end: number
          t_start: number
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          organisation_id: string
          seq: number
          session_id: string
          speaker?: string
          t_end?: number
          t_start?: number
          text?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          organisation_id?: string
          seq?: number
          session_id?: string
          speaker?: string
          t_end?: number
          t_start?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_segments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_segments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scribe_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_sentences: {
        Row: {
          deleted: boolean
          flag_reason: string | null
          flagged: boolean
          id: string
          note_id: string
          organisation_id: string
          origin: string
          position: number
          resolution: string | null
          section: string
          section_order: number
          source_seqs: number[]
          text: string
          updated_at: string
        }
        Insert: {
          deleted?: boolean
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          note_id: string
          organisation_id: string
          origin?: string
          position: number
          resolution?: string | null
          section: string
          section_order: number
          source_seqs?: number[]
          text: string
          updated_at?: string
        }
        Update: {
          deleted?: boolean
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          note_id?: string
          organisation_id?: string
          origin?: string
          position?: number
          resolution?: string | null
          section?: string
          section_order?: number
          source_seqs?: number[]
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_sentences_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "scribe_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_sentences_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_sessions: {
        Row: {
          clinician_id: string
          context: string
          created_at: string
          ended_at: string | null
          episode_id: string | null
          id: string
          organisation_id: string
          patient_id: string | null
          patient_label: string
          started_at: string | null
          status: string
          template_id: string
          updated_at: string
        }
        Insert: {
          clinician_id: string
          context?: string
          created_at?: string
          ended_at?: string | null
          episode_id?: string | null
          id?: string
          organisation_id: string
          patient_id?: string | null
          patient_label: string
          started_at?: string | null
          status?: string
          template_id?: string
          updated_at?: string
        }
        Update: {
          clinician_id?: string
          context?: string
          created_at?: string
          ended_at?: string | null
          episode_id?: string | null
          id?: string
          organisation_id?: string
          patient_id?: string | null
          patient_label?: string
          started_at?: string | null
          status?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_sessions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_solo_organisation: {
        Args: {
          _country: string
          _full_name: string
          _profession: string
          _registration_body: string
          _registration_number: string
        }
        Returns: string
      }
      is_clinical_member: { Args: { _org: string }; Returns: boolean }
      is_org_admin: { Args: { _org: string }; Returns: boolean }
      is_org_member: { Args: { _org: string }; Returns: boolean }
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
          age: number
          diagnosis: string
          heart_rate: number
          id: string
          last_observation: string
          name: string
          owner: string
          pathway: string
          pronouns: string
          reason: string
          region: string
          respiratory_rate: number
          score: number
          spo2: number
          status: string
          systolic_bp: number
          team: string
          temperature: number
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
