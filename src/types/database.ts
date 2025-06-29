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
      users: {
        Row: {
          id: string
          email: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
      game_scores: {
        Row: {
          id: string
          user_id: string
          game_type: string
          score: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: string
          score: number
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: string
          score?: number
          timestamp?: string
        }
      }
      game_saves: {
        Row: {
          id: string
          user_id: string
          game_type: string
          state: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: string
          state: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: string
          state?: Json
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          unlocked_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          sound_enabled: boolean
          music_enabled: boolean
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sound_enabled?: boolean
          music_enabled?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sound_enabled?: boolean
          music_enabled?: boolean
          theme?: string
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