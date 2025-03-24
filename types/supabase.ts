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
          id: string
          user_id: string
          transaction_date: string
          transaction_type: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset: string
          quantity: number
          price_usd: number
          total_usd: number
          fee_usd: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_date: string
          transaction_type: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset?: string
          quantity: number
          price_usd: number
          total_usd: number
          fee_usd: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_date?: string
          transaction_type?: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset?: string
          quantity?: number
          price_usd?: number
          total_usd?: number
          fee_usd?: number
          created_at?: string
          updated_at?: string
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