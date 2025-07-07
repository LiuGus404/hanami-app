export interface ScheduleSlot {
  id: string
  weekday: number | null
  timeslot: string | null
  max_students: number | null
  assigned_teachers: string | null
  created_at: string
  updated_at: string | null
  course_type: string | null
  duration: string | null
}

export interface PreferTime {
  week: number[]
  range: string[]
}

export interface ScheduleOption {
  label: string
  value: string
  weekday: number
  timeslot: string
} 