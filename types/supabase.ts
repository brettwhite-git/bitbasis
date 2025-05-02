export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      fear_greed_index: {
        Row: {
          classification: string
          created_at: string
          date: string | null
          id: string
          last_updated: string
          value: number
        }
        Insert: {
          classification: string
          created_at?: string
          date?: string | null
          id?: string
          last_updated: string
          value: number
        }
        Update: {
          classification?: string
          created_at?: string
          date?: string | null
          id?: string
          last_updated?: string
          value?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          asset: string
          buy_currency: string | null
          buy_fiat_amount: number | null
          created_at: string
          csv_upload_id: string | null
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
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset: string
          buy_currency?: string | null
          buy_fiat_amount?: number | null
          created_at?: string
          csv_upload_id?: string | null
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
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset?: string
          buy_currency?: string | null
          buy_fiat_amount?: number | null
          created_at?: string
          csv_upload_id?: string | null
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
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_csv_upload_id_fkey"
            columns: ["csv_upload_id"]
            isOneToOne: false
            referencedRelation: "csv_uploads"
            referencedColumns: ["id"]
          },
        ]
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
      transfers: {
        Row: {
          amount_btc: number
          amount_fiat: number | null
          asset: string
          created_at: string
          csv_upload_id: string | null
          date: string
          fee_amount_btc: number | null
          hash: string | null
          id: number
          price: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_btc: number
          amount_fiat?: number | null
          asset?: string
          created_at?: string
          csv_upload_id?: string | null
          date: string
          fee_amount_btc?: number | null
          hash?: string | null
          id?: number
          price?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_btc?: number
          amount_fiat?: number | null
          asset?: string
          created_at?: string
          csv_upload_id?: string | null
          date?: string
          fee_amount_btc?: number | null
          hash?: string | null
          id?: number
          price?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_csv_upload_id_fkey"
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
      call_update_price: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_and_update_btc_ath: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fetch_and_store_btc_price_http: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      fetch_and_update_btc_spot_price: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_ath: {
        Args: {
          new_price_usd: number
          new_ath_date: string
          source_name?: string
        }
        Returns: undefined
      }
      update_btc_price: {
        Args: Record<PropertyKey, never>
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
  public: {
    Enums: {},
  },
} as const
