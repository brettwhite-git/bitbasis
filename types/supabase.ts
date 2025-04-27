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
      csv_uploads: {
        Row: {
          id: string
          created_at: string
          user_id: string
          filename: string
          original_filename: string
          status: 'pending' | 'processing' | 'completed' | 'error'
          row_count: number | null
          imported_row_count: number | null
          error_message: string | null
          file_size: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          filename: string
          original_filename: string
          status: 'pending' | 'processing' | 'completed' | 'error'
          row_count?: number | null
          imported_row_count?: number | null
          error_message?: string | null
          file_size: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          filename?: string
          original_filename?: string
          status?: 'pending' | 'processing' | 'completed' | 'error'
          row_count?: number | null
          imported_row_count?: number | null
          error_message?: string | null
          file_size?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          asset: string
          buy_currency: string | null
          buy_fiat_amount: number | null
          created_at: string
          date: string
          exchange: string | null
          id: number
          price: number
          received_btc_amount: number | null
          received_currency: string | null
          received_fiat_amount: number | null
          received_fiat_currency: string | null
          sell_btc_amount: number | null
          sell_btc_currency: string | null
          service_fee: number | null
          service_fee_currency: string | null
          type: "buy" | "sell"
          updated_at: string | null
          user_id: string
          csv_upload_id: string | null
        }
        Insert: {
          asset: string
          buy_currency?: string | null
          buy_fiat_amount?: number | null
          created_at?: string
          date: string
          exchange?: string | null
          id?: number
          price: number
          received_btc_amount?: number | null
          received_currency?: string | null
          received_fiat_amount?: number | null
          received_fiat_currency?: string | null
          sell_btc_amount?: number | null
          sell_btc_currency?: string | null
          service_fee?: number | null
          service_fee_currency?: string | null
          type: "buy" | "sell"
          updated_at?: string | null
          user_id: string
          csv_upload_id?: string | null
        }
        Update: {
          asset?: string
          buy_currency?: string | null
          buy_fiat_amount?: number | null
          created_at?: string
          date?: string
          exchange?: string | null
          id?: number
          price?: number
          received_btc_amount?: number | null
          received_currency?: string | null
          received_fiat_amount?: number | null
          received_fiat_currency?: string | null
          sell_btc_amount?: number | null
          sell_btc_currency?: string | null
          service_fee?: number | null
          service_fee_currency?: string | null
          type?: "buy" | "sell"
          updated_at?: string | null
          user_id?: string
          csv_upload_id?: string | null
        }
        Relationships: []
      }
      transfers: {
        Row: {
          id: number
          created_at: string
          updated_at: string | null
          user_id: string
          date: string
          type: "withdrawal" | "deposit"
          asset: string
          amount_btc: number
          fee_amount_btc: number | null
          amount_fiat: number | null
          price: number | null
          hash: string | null
          csv_upload_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id: string
          date: string
          type: "withdrawal" | "deposit"
          asset?: string
          amount_btc: number
          fee_amount_btc?: number | null
          amount_fiat?: number | null
          price?: number | null
          hash?: string | null
          csv_upload_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id?: string
          date?: string
          type?: "withdrawal" | "deposit"
          asset?: string
          amount_btc?: number
          fee_amount_btc?: number | null
          amount_fiat?: number | null
          price?: number | null
          hash?: string | null
          csv_upload_id?: string | null
        }
        Relationships: []
      }
      spot_price: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          price_usd: number
          source: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          price_usd: number
          source?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          price_usd?: number
          source?: string | null
        }
        Relationships: []
      }
      ath: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          price_usd: number
          ath_date: string
          source: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          price_usd: number
          ath_date: string
          source?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          price_usd?: number
          ath_date?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

