export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
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
      answers: {
        Row: {
          answer: string
          created_at: string | null
          id: number
          is_bot_answer: boolean
          player: string | null
          question: number
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: number
          is_bot_answer: boolean
          player?: string | null
          question: number
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: number
          is_bot_answer?: boolean
          player?: string | null
          question?: number
        }
      }
      games: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string
          random_bot_number: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string
          random_bot_number?: string
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string
          random_bot_number?: string
          status?: string
        }
      }
      player_games: {
        Row: {
          created_at: string
          game: string
          is_voted_out: boolean
          player: string | null
          random_player_number: string
        }
        Insert: {
          created_at?: string
          game: string
          is_voted_out?: boolean
          player?: string | null
          random_player_number?: string
        }
        Update: {
          created_at?: string
          game?: string
          is_voted_out?: boolean
          player?: string | null
          random_player_number?: string
        }
      }
      questions: {
        Row: {
          created_at: string | null
          game: string
          id: number
          question: string
        }
        Insert: {
          created_at?: string | null
          game: string
          id?: number
          question: string
        }
        Update: {
          created_at?: string | null
          game?: string
          id?: number
          question?: string
        }
      }
      votes: {
        Row: {
          answer: number
          created_at: string | null
          player: string
        }
        Insert: {
          answer: number
          created_at?: string | null
          player: string
        }
        Update: {
          answer?: number
          created_at?: string | null
          player?: string
        }
      }
    }
    Views: {
      answers_with_player_games: {
        Row: {
          answer: string | null
          created_at: string | null
          id: number | null
          is_bot_answer: boolean | null
          player: string | null
          question: number | null
          random_player_number: string | null
          vote_count: number | null
        }
      }
    }
    Functions: {
      add_question_to_game: {
        Args: {
          p_game_id: string
          p_question_text: string
        }
        Returns: {
          created_at: string | null
          game: string
          id: number
          question: string
        }
      }
      cast_vote: {
        Args: {
          p_player_id: string
          p_answer_id: number
        }
        Returns: undefined
      }
      find_or_create_active_game:
        | {
            Args: {
              p_user: string
              p_num_players: number
            }
            Returns: {
              game_id: string
              player_count: number
              game_state: string
            }[]
          }
        | {
            Args: {
              p_user: string
              p_num_players: number
              p_get_new_game: boolean
            }
            Returns: {
              game_id: string
              player_count: number
              game_state: string
            }[]
          }
      start_game_tick: {
        Args: {
          p_game_id: string
          p_time_allowance_seconds: number
        }
        Returns: string
      }
      submit_answer:
        | {
            Args: {
              p_user_id: string
              p_question_id: number
              p_answer_text: string
              p_allowed_response_time: number
            }
            Returns: {
              answer: string
              created_at: string | null
              id: number
              is_bot_answer: boolean
              player: string | null
              question: number
            }
          }
        | {
            Args: {
              p_user_id: string
              p_question_id: number
              p_answer_text: string
            }
            Returns: {
              answer: string
              created_at: string | null
              id: number
              is_bot_answer: boolean
              player: string | null
              question: number
            }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

