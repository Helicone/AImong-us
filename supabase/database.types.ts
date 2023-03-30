export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: number
          created_at: string | null
          session_id: string
          text: string
          user_id: string | null
          bot_id: number | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          session_id: string
          text: string
          user_id?: string | null
          bot_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string | null
          session_id?: string
          text?: string
          user_id?: string | null
          bot_id?: number | null
        }
      }
      sessions: {
        Row: {
          id: string
          created_at: string | null
          state: number
          player_1: string
          player_2: string | null
          bot_id: number | null
        }
        Insert: {
          id: string
          created_at?: string | null
          state?: number
          player_1: string
          player_2?: string | null
          bot_id?: number | null
        }
        Update: {
          id?: string
          created_at?: string | null
          state?: number
          player_1?: string
          player_2?: string | null
          bot_id?: number | null
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

