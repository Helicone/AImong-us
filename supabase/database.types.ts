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
          created_at: string | null
          question: number
          answer: string
          player: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          question: number
          answer: string
          player: string
        }
        Update: {
          id?: number
          created_at?: string | null
          question?: number
          answer?: string
          player?: string
        }
      }
      games: {
        Row: {
          id: string
          created_at: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string | null
          status: string
        }
        Update: {
          id?: string
          created_at?: string | null
          status?: string
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
          created_at: string | null
          question: string
          game: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          question: string
          game: string
        }
        Update: {
          id?: number
          created_at?: string | null
          question?: string
          game?: string
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
      find_or_create_active_game: {
        Args: { p_user: string; p_num_players: number }
        Returns: { game_id: string; player_count: number; game_state: string }[]
      }
      submit_answer:
        | {
            Args: {
              p_user_id: string
              p_question_id: number
              p_answer_text: string
            }
            Returns: unknown
          }
        | {
            Args: {
              p_user_id: string
              p_question_id: number
              p_answer_text: string
              p_allowed_response_time: unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              p_user_id: string
              p_question_id: number
              p_answer_text: string
              p_allowed_response_time: number
            }
            Returns: unknown
          }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

