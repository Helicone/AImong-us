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
          player: string | null
          is_bot_answer: boolean
        }
        Insert: {
          id?: number
          created_at?: string | null
          question: number
          answer: string
          player?: string | null
          is_bot_answer: boolean
        }
        Update: {
          id?: number
          created_at?: string | null
          question?: number
          answer?: string
          player?: string | null
          is_bot_answer?: boolean
        }
      }
      games: {
        Row: {
          id: string
          created_at: string | null
          random_bot_number: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string | null
          random_bot_number?: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string | null
          random_bot_number?: string
          status?: string
        }
      }
      player_games: {
        Row: {
          game: string
          player: string | null
          random_player_number: string
          is_voted_out: boolean
          created_at: string
        }
        Insert: {
          game: string
          player?: string | null
          random_player_number?: string
          is_voted_out?: boolean
          created_at?: string
        }
        Update: {
          game?: string
          player?: string | null
          random_player_number?: string
          is_voted_out?: boolean
          created_at?: string
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
          created_at: string | null
          player: string
          answer: number
        }
        Insert: {
          created_at?: string | null
          player: string
          answer: number
        }
        Update: {
          created_at?: string | null
          player?: string
          answer?: number
        }
      }
    }
    Views: {
      answers_with_player_games: {
        Row: {
          id: number | null
          created_at: string | null
          question: number | null
          answer: string | null
          player: string | null
          is_bot_answer: boolean | null
          random_player_number: string | null
          vote_count: number | null
        }
      }
    }
    Functions: {
      add_question_to_game: {
        Args: { p_game_id: string; p_question_text: string }
        Returns: unknown
      }
      cast_vote: {
        Args: { p_player_id: string; p_answer_id: number }
        Returns: undefined
      }
      find_or_create_active_game: {
        Args: { p_user: string; p_num_players: number }
        Returns: { game_id: string; player_count: number; game_state: string }[]
      }
      start_game_tick: {
        Args: { p_game_id: string; p_time_allowance_seconds: number }
        Returns: undefined
      }
      submit_answer: {
        Args: {
          p_user_id: string
          p_question_id: number
          p_answer_text: string
          p_allowed_response_time: number
        }
        Returns: unknown
      }
      voting_results_tick: {
        Args: {
          p_game_id: string
          p_time_allowance_seconds: number
          p_num_questions_per_game: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

