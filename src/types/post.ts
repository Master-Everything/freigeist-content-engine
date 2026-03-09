export interface PostBlocks {
  excerpt: string;
  main_video_url: string;
  main_video_embed?: string;
  summary_box_title: string;
  summary_lead: string;
  summary_points: string[];
  guest_short_bio: string;
  guest_image_url?: string;
  section_1_title: string;
  section_1_body: string;
  section_2_title: string;
  section_2_body: string;
  section_3_title: string;
  section_3_body: string;
  // Optional blocks
  additional_video_embed?: string;
  pretty_link_shortcode?: string;
  resource_links?: string;
  resource_notes?: string;
}

export interface Post {
  id: string;
  guest_id?: string | null;
  status: string;
  post_slug: string | null;
  guest_name: string;
  guest_image_url: string | null;
  interview_title: string;
  youtube_url: string | null;
  newsletter_text: string | null;
  telegram_text: string | null;
  guest_website_url: string | null;
  guest_short_bio: string | null;
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
  guest_website_url: string;
  guest_short_bio: string;
  prettylink_shortcodes: string;
  video_transcript: string;
}
