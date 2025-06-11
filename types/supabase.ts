export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      application_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_stack: string | null
          id: string
          level: string
          message: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_stack?: string | null
          id?: string
          level: string
          message: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_stack?: string | null
          id?: string
          level?: string
          message?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ath: {
        Row: {
          ath_date: string
          created_at: string
          id: number
          price_usd: number
          source: string | null
          updated_at: string
        }
        Insert: {
          ath_date: string
          created_at?: string
          id?: number
          price_usd: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          ath_date?: string
          created_at?: string
          id?: number
          price_usd?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      btc_monthly_close: {
        Row: {
          close: number
          created_at: string | null
          date: string
          id: number
          updated_at: string | null
        }
        Insert: {
          close: number
          created_at?: string | null
          date: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          close?: number
          created_at?: string | null
          date?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      csv_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          file_size: number
          filename: string
          id: string
          imported_row_count: number | null
          original_filename: string
          row_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_size: number
          filename: string
          id?: string
          imported_row_count?: number | null
          original_filename: string
          row_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_size?: number
          filename?: string
          id?: string
          imported_row_count?: number | null
          original_filename?: string
          row_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      fear_greed_index: {
        Row: {
          classification: string
          created_at: string
          date: string | null
          id: number
          last_updated: string
          value: number
        }
        Insert: {
          classification: string
          created_at?: string
          date?: string | null
          id?: number
          last_updated?: string
          value: number
        }
        Update: {
          classification?: string
          created_at?: string
          date?: string | null
          id?: number
          last_updated?: string
          value?: number
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      spot_price: {
        Row: {
          created_at: string
          id: number
          price_usd: number
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          price_usd: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          price_usd?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptance: {
        Row: {
          acceptance_method: string
          acceptance_type: string
          accepted_at: string
          created_at: string
          id: string
          ip_address: string | null
          privacy_version: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acceptance_method: string
          acceptance_type?: string
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          privacy_version: string
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acceptance_method?: string
          acceptance_type?: string
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          privacy_version?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset: string
          comment: string | null
          created_at: string
          csv_upload_id: string | null
          date: string
          fee_amount: number | null
          fee_cost_basis: number | null
          fee_currency: string | null
          fee_realized_return: number | null
          from_address: string | null
          from_address_name: string | null
          id: number
          price: number | null
          realized_return: number | null
          received_amount: number | null
          received_cost_basis: number | null
          received_currency: string | null
          sent_amount: number | null
          sent_cost_basis: number | null
          sent_currency: string | null
          to_address: string | null
          to_address_name: string | null
          transaction_hash: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset?: string
          comment?: string | null
          created_at?: string
          csv_upload_id?: string | null
          date: string
          fee_amount?: number | null
          fee_cost_basis?: number | null
          fee_currency?: string | null
          fee_realized_return?: number | null
          from_address?: string | null
          from_address_name?: string | null
          id?: number
          price?: number | null
          realized_return?: number | null
          received_amount?: number | null
          received_cost_basis?: number | null
          received_currency?: string | null
          sent_amount?: number | null
          sent_cost_basis?: number | null
          sent_currency?: string | null
          to_address?: string | null
          to_address_name?: string | null
          transaction_hash?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset?: string
          comment?: string | null
          created_at?: string
          csv_upload_id?: string | null
          date?: string
          fee_amount?: number | null
          fee_cost_basis?: number | null
          fee_currency?: string | null
          fee_realized_return?: number | null
          from_address?: string | null
          from_address_name?: string | null
          id?: number
          price?: number | null
          realized_return?: number | null
          received_amount?: number | null
          received_cost_basis?: number | null
          received_currency?: string | null
          sent_amount?: number | null
          sent_cost_basis?: number | null
          sent_currency?: string | null
          to_address?: string | null
          to_address_name?: string | null
          transaction_hash?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_csv_upload_id_fkey"
            columns: ["csv_upload_id"]
            isOneToOne: false
            referencedRelation: "csv_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      call_update_price: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_user_add_transactions: {
        Args: { user_uuid: string; transaction_count: number }
        Returns: boolean
      }
      check_and_update_btc_ath: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fetch_and_update_btc_spot_price: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_last_day_of_month: {
        Args: { input_date: string }
        Returns: string
      }
      get_latest_terms_acceptance: {
        Args: { p_user_id: string }
        Returns: {
          terms_version: string
          privacy_version: string
          accepted_at: string
        }[]
      }
      get_monthly_btc_cron_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          jobname: string
          schedule: string
          active: boolean
        }[]
      }
      get_monthly_close_data: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          date: string
          close: number
          created_at: string
        }[]
      }
      get_user_subscription_info: {
        Args: { user_uuid: string }
        Returns: {
          subscription_status: string
          transaction_count: number
          can_add_transaction: boolean
          should_show_warning: boolean
          subscription_data: Json
        }[]
      }
      get_user_transaction_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_transaction_count_v2: {
        Args: { user_uuid: string }
        Returns: number
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: unknown
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: unknown
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: unknown
      }
      http_head: {
        Args: { uri: string }
        Returns: unknown
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: unknown
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: unknown
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: unknown
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_last_day_of_month: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      trigger_monthly_btc_update: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_ath: {
        Args: {
          new_price_usd: number
          new_ath_date: string
          source_name?: string
        }
        Returns: undefined
      }
      update_fear_greed_index: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_spot_price: {
        Args: { new_price_usd: number; source_name?: string }
        Returns: undefined
      }
      upsert_monthly_close: {
        Args: { month_date: string; close_price: number }
        Returns: {
          id: number
          date: string
          close: number
          was_updated: boolean
        }[]
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_monthly_close_completeness: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          missing_month: string
        }[]
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
      ],
    },
  },
} as const

