export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: number
          created_at: string
          updated_at: string | null
          user_id: string
          date: string
          asset: string
          price: number
          exchange: string | null
          buy_fiat_amount: number | null
          buy_currency: string | null
          received_btc_amount: number | null
          received_currency: string | null
          service_fee: number | null
          service_fee_currency: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id: string
          date: string
          asset: string
          price: number
          exchange?: string | null
          buy_fiat_amount?: number | null
          buy_currency?: string | null
          received_btc_amount?: number | null
          received_currency?: string | null
          service_fee?: number | null
          service_fee_currency?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id?: string
          date?: string
          asset?: string
          price?: number
          exchange?: string | null
          buy_fiat_amount?: number | null
          buy_currency?: string | null
          received_btc_amount?: number | null
          received_currency?: string | null
          service_fee?: number | null
          service_fee_currency?: string | null
        }
      }
      sends: {
        Row: {
          id: number
          created_at: string
          updated_at: string | null
          user_id: string
          date: string
          asset: string
          sent_amount: number
          sent_currency: string
          network_fee: number | null
          network_fee_currency: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id: string
          date: string
          asset: string
          sent_amount: number
          sent_currency: string
          network_fee?: number | null
          network_fee_currency?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id?: string
          date?: string
          asset?: string
          sent_amount?: number
          sent_currency?: string
          network_fee?: number | null
          network_fee_currency?: string | null
        }
      }
      receives: {
        Row: {
          id: number
          created_at: string
          updated_at: string | null
          user_id: string
          date: string
          asset: string
          received_amount: number
          received_currency: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id: string
          date: string
          asset: string
          received_amount: number
          received_currency: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string | null
          user_id?: string
          date?: string
          asset?: string
          received_amount?: number
          received_currency?: string
        }
      }
      bitcoin_prices: {
        Row: {
          id: number
          created_at: string
          value: number
          last_updated: string
        }
        Insert: {
          id?: number
          created_at?: string
          value: number
          last_updated?: string
        }
        Update: {
          id?: number
          created_at?: string
          value?: number
          last_updated?: string
        }
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
  }
} 