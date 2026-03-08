export interface PostBlocks {
  headline: string;
  excerpt: string;
  youtube_url: string;
  summary_title: string;
  summary_lead: string;
  summary_bullets: string[];
  guest_bio: string;
  section1_title: string;
  section1_content: string;
  section2_title: string;
  section2_content: string;
  section3_title: string;
  section3_content: string;
  // Optional blocks
  additional_video_url?: string;
  prettylink_shortcodes?: string;
  resources?: string;
}

export interface Post {
  id: string;
  status: string;
  guest_name: string;
  interview_title: string;
  youtube_url: string | null;
  newsletter_text: string | null;
  telegram_text: string | null;
  guest_website: string | null;
  guest_profile_text: string | null;
  prettylink_shortcodes: string | null;
  blocks: PostBlocks | null;
  created_at: string;
  updated_at: string;
}

export interface SourceFormData {
  guest_name: string;
  interview_title: string;
  youtube_url: string;
  newsletter_text: string;
  telegram_text: string;
  guest_website: string;
  guest_profile_text: string;
  prettylink_shortcodes: string;
}
