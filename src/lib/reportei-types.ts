// ---------------------------------------------------------------------------
// Reportei API V2 Types
// ---------------------------------------------------------------------------

export interface ReporteiProject {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface ReporteiIntegration {
  id: number
  project_id: number
  slug: string
  name: string
  status: string
  created_at: string
}

export interface ReporteiMetricDefinition {
  id: string
  reference_key: string
  component: string
  metrics: string[]
  dimensions: string[]
  sort: string[]
  custom: Record<string, string> | string[]
  type: string | string[]
  name?: string
  description?: string
}

export interface ReporteiMetricRequestItem {
  id: string
  reference_key: string
  component: string
  metrics: string[]
  dimensions?: string[]
  sort?: string[]
  custom?: Record<string, string> | string[]
  type?: string | string[]
}

export interface ReporteiMetricRequest {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
  comparison_start?: string // YYYY-MM-DD
  comparison_end?: string   // YYYY-MM-DD
  integration_id: number
  metrics: ReporteiMetricRequestItem[]
}

export interface ReporteiMetricDataItem {
  values: number | null
  trend: {
    data: number[]
  }
  comparison: {
    values: number | null
    difference: number | null
    absoluteDifference: number | null
  }
}

export interface ReporteiMetricResponse {
  data: Record<string, ReporteiMetricDataItem>
}

export interface ReporteiPaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Normalized platform data for the dashboard
export interface PlatformData {
  platform: 'Instagram' | 'LinkedIn' | 'YouTube'
  integrationId: number
  slug: string
  metrics: {
    impressions: number
    reach: number
    engagement: number
    followers: number
    growth_rate: number
    [key: string]: number
  }
  comparison: {
    previous_period: Record<string, number>
    variation_percent: Record<string, number>
  }
  trend: Record<string, number[]>  // daily data per metric key
}

// Slug to Platform mapping
export const SLUG_TO_PLATFORM: Record<string, 'Instagram' | 'LinkedIn' | 'YouTube'> = {
  'facebook_ads': 'Instagram',
  'instagram': 'Instagram',
  'instagram_business': 'Instagram',
  'linkedin': 'LinkedIn',
  'linkedin_company': 'LinkedIn',
  'youtube': 'YouTube',
  'youtube_channel': 'YouTube',
}

// Platform to preferred slugs
export const PLATFORM_SLUGS: Record<string, string[]> = {
  'Instagram': ['instagram', 'instagram_business', 'facebook_ads'],
  'LinkedIn': ['linkedin', 'linkedin_company'],
  'YouTube': ['youtube', 'youtube_channel'],
}

// Common metric reference keys per platform
// Keys use the prefix from the API (ig:, li:, yt:)
export const PLATFORM_METRIC_KEYS: Record<string, string[]> = {
  'Instagram': [
    'ig:views', 'ig:reach', 'ig:media_engagement', 'ig:followers_count',
    'ig:current_followers_count', 'ig:new_followers_count',
    'ig:media_saved', 'ig:media_saved_insights',
    'ig:post_shares_count', 'ig:post_shares_count_insights',
    'ig:like_count', 'ig:like_count_insights',
    'ig:comments_count', 'ig:comments_count_insights',
    'ig:profile_views', 'ig:total_clicks',
    'ig:media_count', 'ig:media_reach', 'ig:media_views',
    'ig:reels_views', 'ig:reels_reach',
    'ig:reels_shares', 'ig:reels_shares_insights',
    'ig:reels_saved', 'ig:reels_saved_insights',
    'ig:reels_count', 'ig:reels_interactions',
    'ig:post_interaction_rate', 'ig:reels_engagement_rate',
    'ig:stories_reach_total', 'ig:stories_count',
  ],
  'LinkedIn': [
    'li:impressions', 'li:engagement', 'li:followers_count',
    'li:comments', 'li:reactions', 'li:shares', 'li:clicks',
    'li:click_through_rate', 'li:follower_gains',
    'li:new_followers_count', 'li:posts_count',
  ],
  'YouTube': [
    'yt:views', 'yt:impressions', 'yt:estimated_minutes_watched',
    'yt:average_view_duration', 'yt:average_view_percentage',
    'yt:subscribers_gained', 'yt:likes', 'yt:comments',
    'yt:click_through_rate', 'yt:shares',
  ],
}

// Mapping from API reference_key to normalized metric name
export const METRIC_KEY_NORMALIZATION: Record<string, string> = {
  // Instagram
  'ig:views': 'impressions',
  'ig:reach': 'reach',
  'ig:media_engagement': 'engagement',
  'ig:followers_count': 'followers',
  'ig:current_followers_count': 'current_followers',
  'ig:new_followers_count': 'new_followers',
  'ig:media_saved': 'saves',
  'ig:post_shares_count': 'shares',
  'ig:like_count': 'likes',
  'ig:comments_count': 'comments',
  'ig:profile_views': 'profile_views',
  'ig:total_clicks': 'clicks',
  'ig:media_count': 'posts_count',
  'ig:media_reach': 'posts_reach',
  'ig:media_views': 'posts_views',
  'ig:reels_views': 'reels_views',
  'ig:reels_reach': 'reels_reach',
  'ig:reels_shares': 'reels_shares',
  'ig:reels_saved': 'reels_saved',
  'ig:reels_count': 'reels_count',
  'ig:reels_interactions': 'reels_interactions',
  'ig:media_saved_insights': 'saves',
  'ig:post_shares_count_insights': 'shares',
  'ig:like_count_insights': 'likes',
  'ig:comments_count_insights': 'comments',
  'ig:reels_shares_insights': 'reels_shares',
  'ig:reels_saved_insights': 'reels_saved',
  'ig:post_interaction_rate': 'interaction_rate',
  'ig:reels_engagement_rate': 'reels_engagement_rate',
  'ig:stories_reach_total': 'stories_reach',
  'ig:stories_count': 'stories_count',
  // LinkedIn
  'li:impressions': 'impressions',
  'li:engagement': 'engagement',
  'li:followers_count': 'followers',
  'li:comments': 'comments',
  'li:reactions': 'reactions',
  'li:shares': 'shares',
  'li:clicks': 'clicks',
  'li:click_through_rate': 'ctr',
  'li:follower_gains': 'new_followers',
  'li:new_followers_count': 'new_followers',
  'li:posts_count': 'posts_count',
  // YouTube
  'yt:views': 'impressions',
  'yt:impressions': 'yt_impressions',
  'yt:estimated_minutes_watched': 'watch_time',
  'yt:average_view_duration': 'avg_view_duration',
  'yt:average_view_percentage': 'retention',
  'yt:subscribers_gained': 'new_followers',
  'yt:likes': 'likes',
  'yt:comments': 'comments',
  'yt:click_through_rate': 'ctr',
  'yt:shares': 'shares',
}
