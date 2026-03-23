import { z } from "zod/v4";

export const recipientSchema = z.object({
  full_name: z.string().min(1, "Ten khong duoc de trong"),
  phone: z.string().optional(),
  email: z.email("Email khong hop le").optional().or(z.literal("")),
  relationship: z
    .enum([
      "spouse",
      "parent",
      "child",
      "sibling",
      "friend",
      "boss",
      "colleague",
      "partner",
      "client",
      "other",
    ])
    .default("other"),
  address: z.string().optional(),
  district: z.string().optional(),
  city: z.string().default("Ha Noi"),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const occasionSchema = z.object({
  type: z.enum([
    "birthday",
    "anniversary",
    "opening",
    "congrats",
    "holiday",
    "women",
    "teacher",
    "tet",
    "custom",
  ]),
  label: z.string().optional(),
  date_day: z.number().min(1).max(31),
  date_month: z.number().min(1).max(12),
  date_year: z.number().optional(),
  is_lunar: z.boolean().default(false),
  remind_days_before: z.number().default(7),
  auto_order: z.boolean().default(false),
  preferred_combo_id: z.string().uuid().optional(),
  preferred_budget: z.number().optional(),
  note: z.string().optional(),
});

export type RecipientInput = z.infer<typeof recipientSchema>;
export type OccasionInput = z.infer<typeof occasionSchema>;
