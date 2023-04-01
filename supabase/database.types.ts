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
      votes: {
        Row: {
          question: number
          created_at: string | null
          player: string
          answer: number
        }
        Insert: {
          question?: number
          created_at?: string | null
          player: string
          answer: number
        }
        Update: {
          question?: number
          created_at?: string | null
          player?: string
          answer?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_or_create_active_game:
        | {
            Args: { p_user: string }
            Returns: {
              game_id: string
              player_count: number
              game_state: string
            }[]
          }
        | {
            Args: { p_user: string; p_num_players: number }
            Returns: {
              game_id: string
              player_count: number
              game_state: string
            }[]
          }
      submit_answer: {
        Args: {
          p_user_id: string
          p_question_id: number
          p_answer_text: string
        }
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

