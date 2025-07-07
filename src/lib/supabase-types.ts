import { Database } from './database.types'

export type Tables<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Row"]

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Insert"]

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Update"]

export type Enums<EnumName extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][EnumName]

export type CompositeTypes<CompositeTypeName extends keyof Database["public"]["CompositeTypes"]> = Database["public"]["CompositeTypes"][CompositeTypeName] 