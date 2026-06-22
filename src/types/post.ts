export interface PostBlocks {
  excerpt: string;
  main_video_url: string;
  main_video_embed?: string;
  summary_box_title: string;
  summary_lead: string;
  summary_paragraphs: string[];
  /** @deprecated Use summary_paragraphs instead */
  summary_points?: string[];
  guest_short_bio: string;
  guest_image_url?: string;
  guest_website_cta?: string;
  section_1_title: string;
  section_1_body: string;
  section_2_title: string;
  section_2_body: string;
  section_3_title: string;
  section_3_body: string;
  section_4_title: string;
  section_4_body: string;
  section_5_title: string;
  section_5_body: string;
  section_6_title: string;
  section_6_body: string;
  // Optional blocks
  additional_video_embed?: string;
  pretty_link_shortcode?: string;
  resource_links?: string;
  resource_notes?: string;
  cta_affiliate_url?: string;
  cta_affiliate_label?: string;
  top_image_url?: string;
  top_image_link?: string;
  top_image_alt?: string;
  mid_image_url?: string;
  mid_image_link?: string;
  mid_image_alt?: string;
  end_image_url?: string;
  end_image_link?: string;
  end_image_alt?: string;
}

export interface Post {
  id: string;
  guest_id?: string | null;
  speaker_id?: string | null;
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
  // Interview-spezifische Felder
  interview_topic?: string | null;
  product?: string | null;
  product_market_since?: string | null;
  previous_interviews?: string | null;
  critical_voices?: string | null;
  selected_affiliate_indices?: number[] | null;
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
