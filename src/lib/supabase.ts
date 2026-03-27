import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client (API routes only — never expose service_role key)
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface DailyMetricRow {
  id?: number
  project_id: number
  platform: 'Instagram' | 'LinkedIn' | 'YouTube'
  date: string // YYYY-MM-DD
  metrics: Record<string, number>
  integration_id?: number
  synced_at?: string
}
