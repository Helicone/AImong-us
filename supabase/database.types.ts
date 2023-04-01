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
      answers: {
        Row: {
          id: number
          question: number
          answer: string
          player: string
          created_at: string | null
        }
        Insert: {
          id?: number
          question: number
          answer: string
          player: string
          created_at?: string | null
        }
        Update: {
          id?: number
          question?: number
          answer?: string
          player?: string
          created_at?: string | null
        }
      }
      games: {
        Row: {
          status: string
          id: string
          created_at: string | null
        }
        Insert: {
          status: string
          id?: string
          created_at?: string | null
        }
        Update: {
          status?: string
          id?: string
          created_at?: string | null
        }
      }
      player_games: {
        Row: {
          game: string
          player: string | null
          is_voted_out: boolean
        }
        Insert: {
          game: string
          player?: string | null
          is_voted_out?: boolean
        }
        Update: {
          game?: string
          player?: string | null
          is_voted_out?: boolean
        }
      }
      questions: {
        Row: {
          id: number
          question: string
          game: string
          created_at: string | null
        }
        Insert: {
          id?: number
          question: string
          game: string
          created_at?: string | null
        }
        Update: {
          id?: number
          question?: string
          game?: string
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_question_to_game: {
        Args: { p_game_id: string; p_question_text: string }
        Returns: unknown
      }
      find_or_create_active_game: {
        Args: { p_user: string }
        Returns: { game_id: string; player_count: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

