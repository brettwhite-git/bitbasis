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
      transactions: {
        Row: {
          id: number
          created_at: string
          user_id: string
          date: string
          type: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset: string
          sent_amount: number | null
          sent_currency: string | null
          buy_amount: number | null
          buy_currency: string | null
          sell_amount: number | null
          sell_currency: string | null
          price: number
          received_amount: number | null
          received_currency: string | null
          exchange: string | null
          network_fee: number | null
          network_currency: string | null
          service_fee: number | null
          service_fee_currency: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          date: string
          type: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset: string
          sent_amount?: number | null
          sent_currency?: string | null
          buy_amount?: number | null
          buy_currency?: string | null
          sell_amount?: number | null
          sell_currency?: string | null
          price: number
          received_amount?: number | null
          received_currency?: string | null
          exchange?: string | null
          network_fee?: number | null
          network_currency?: string | null
          service_fee?: number | null
          service_fee_currency?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          date?: string
          type?: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset?: string
          sent_amount?: number | null
          sent_currency?: string | null
          buy_amount?: number | null
          buy_currency?: string | null
          sell_amount?: number | null
          sell_currency?: string | null
          price?: number
          received_amount?: number | null
          received_currency?: string | null
          exchange?: string | null
          network_fee?: number | null
          network_currency?: string | null
          service_fee?: number | null
          service_fee_currency?: string | null
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