import { z } from "zod";

export const interviewSchema = z.object({
  interview_title: z.string().trim().min(1, "Pflichtfeld").max(200),
  interview_topic: z.string().trim().max(500).optional().or(z.literal("")),
  product: z.string().trim().max(500).optional().or(z.literal("")),
  product_market_since: z.string().trim().max(120).optional().or(z.literal("")),
  previous_interviews: z.string().trim().max(2000).optional().or(z.literal("")),
  critical_voices: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type InterviewFormValues = z.infer<typeof interviewSchema>;

export const INTERVIEW_FIELD_MAX: Record<keyof InterviewFormValues, number> = {
  interview_title: 200,
  interview_topic: 500,
  product: 500,
  product_market_since: 120,
  previous_interviews: 2000,
  critical_voices: 2000,
};
