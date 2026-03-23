// ============================================================
// ENUMS
// ============================================================
export type GiftUserRole = "individual" | "business" | "admin";

export type GiftOccasionType =
  | "birthday"
  | "anniversary"
  | "opening"
  | "congrats"
  | "holiday"
  | "women"
  | "teacher"
  | "tet"
  | "custom";

export type GiftOrderStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";

export type GiftPaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export type GiftWalletTxType =
  | "topup"
  | "purchase"
  | "refund"
  | "bonus"
  | "adjustment";

export type RelationshipTag =
  | "spouse"
  | "parent"
  | "child"
  | "sibling"
  | "friend"
  | "boss"
  | "colleague"
  | "partner"
  | "client"
  | "other";

// ============================================================
// DATABASE MODELS
// ============================================================
export interface GiftProfile {
  id: string;
  role: GiftUserRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_tax_code: string | null;
  company_address: string | null;
  is_active: boolean;
  last_active_at: string | null;
  admin_notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface GiftOrderTimelineEvent {
  id: string;
  order_id: string;
  status: GiftOrderStatus;
  actor_id: string | null;
  actor_type: string;
  note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GiftWallet {
  id: string;
  profile_id: string;
  balance: number;
  total_topup: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface GiftTransaction {
  id: string;
  wallet_id: string;
  type: GiftWalletTxType;
  amount: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GiftComboTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  includes: string[];
  image_url: string | null;
  images: string[];
  occasion_types: string[];
  seasonal_start: string | null;
  seasonal_end: string | null;
  max_orders_per_day: number | null;
  delivery_areas: string[];
  popularity_score: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GiftRecipient {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  relationship: RelationshipTag;
  address: string | null;
  district: string | null;
  city: string;
  note: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface GiftOccasion {
  id: string;
  recipient_id: string;
  profile_id: string;
  type: GiftOccasionType;
  label: string | null;
  date_day: number;
  date_month: number;
  date_year: number | null;
  is_lunar: boolean;
  remind_days_before: number;
  auto_order: boolean;
  preferred_combo_id: string | null;
  preferred_budget: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type GiftPaymentMethod = "wallet" | "bank_transfer" | "cod" | "momo";

export interface GiftOrder {
  id: string;
  code: string;
  profile_id: string;
  recipient_id: string | null;
  occasion_id: string | null;
  combo_tier_id: string | null;
  recipient_name: string;
  recipient_phone: string | null;
  delivery_address: string | null;
  delivery_district: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_note: string | null;
  delivery_photo_url: string | null;
  delivery_photos: string[];
  delivery_fee: number;
  delivery_city: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: GiftPaymentMethod;
  payment_status: GiftPaymentStatus;
  paid_at: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  card_message: string | null;
  card_template_id: string | null;
  status: GiftOrderStatus;
  timeline: Record<string, unknown>[];
  assigned_staff_id: string | null;
  internal_note: string | null;
  promotion_id: string | null;
  promotion_code: string | null;
  promotion_discount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GiftCard {
  id: string;
  order_id: string | null;
  template_id: string | null;
  message: string | null;
  image_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GiftCardTemplate {
  id: string;
  name: string;
  occasion_type: GiftOccasionType | null;
  thumbnail_url: string | null;
  template_data: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ============================================================
// P1 MODELS
// ============================================================
export type GiftSubscriptionStatus = "active" | "paused" | "cancelled" | "expired";
export type GiftSubscriptionFrequency = "weekly" | "biweekly" | "monthly";
export type GiftLoyaltyTier = "silver" | "gold" | "diamond";

export interface GiftUnwrapToken {
  id: string;
  order_id: string;
  token: string;
  recipient_viewed_at: string | null;
  recipient_response: string | null;
  recipient_choice_id: string | null;
  address_confirmed: boolean;
  confirmed_address: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface GiftSubscription {
  id: string;
  profile_id: string;
  recipient_id: string;
  combo_tier_id: string;
  frequency: GiftSubscriptionFrequency;
  status: GiftSubscriptionStatus;
  delivery_address: string | null;
  delivery_district: string | null;
  delivery_city: string;
  delivery_time: string;
  card_message: string | null;
  next_delivery_date: string;
  commitment_months: number;
  discount_percent: number;
  total_deliveries: number;
  skipped_count: number;
  paused_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GiftSubscriptionDelivery {
  id: string;
  subscription_id: string;
  order_id: string | null;
  scheduled_date: string;
  status: string;
  skip_reason: string | null;
  created_at: string;
}

export interface GiftLoyaltyAccount {
  id: string;
  profile_id: string;
  tier: GiftLoyaltyTier;
  points_balance: number;
  points_earned_total: number;
  points_redeemed_total: number;
  lifetime_spend: number;
  created_at: string;
  updated_at: string;
}

export interface GiftLoyaltyTransaction {
  id: string;
  loyalty_account_id: string;
  type: string;
  points: number;
  reference_id: string | null;
  description: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface GiftDeliveryStaff {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  assigned_zones: string[];
  max_daily_orders: number;
  created_at: string;
}

export interface GiftDeliveryZone {
  id: string;
  district_code: string;
  district_name: string;
  city: string;
  delivery_fee: number;
  same_day_available: boolean;
  same_day_cutoff: string;
  max_daily_capacity: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface GiftDailyStats {
  id: string;
  stat_date: string;
  total_orders: number;
  total_revenue: number;
  total_topup: number;
  new_clients: number;
  active_subscriptions: number;
  orders_by_combo: Record<string, number>;
  orders_by_occasion: Record<string, number>;
  created_at: string;
}

// ============================================================
// JOINED / COMPUTED TYPES
// ============================================================
export interface GiftRecipientWithOccasions extends GiftRecipient {
  gift_occasions: GiftOccasion[];
}

export interface UpcomingOccasion {
  occasion: GiftOccasion;
  recipient: GiftRecipient;
  days_until: number;
  next_date: Date;
}

export interface DashboardStats {
  total_recipients: number;
  upcoming_7_days: number;
  delivered_this_month: number;
  wallet_balance: number;
}

// ============================================================
// CONSTANTS
// ============================================================
export const OCCASION_CONFIG: Record<
  GiftOccasionType,
  { label: string; icon: string; color: string }
> = {
  birthday: { label: "Sinh nhật", icon: "🎂", color: "#C9A96E" },
  anniversary: { label: "Kỷ niệm", icon: "💍", color: "#D45C8A" },
  opening: { label: "Khai trương", icon: "🎊", color: "#E85C5C" },
  congrats: { label: "Chúc mừng", icon: "🎉", color: "#3A7D54" },
  holiday: { label: "Lễ / Tết", icon: "🧧", color: "#E8A44E" },
  women: { label: "Phụ nữ", icon: "💐", color: "#D45C8A" },
  teacher: { label: "Nhà giáo", icon: "📚", color: "#2C5F8A" },
  tet: { label: "Tết", icon: "🏮", color: "#E85C5C" },
  custom: { label: "Khác", icon: "✨", color: "#6A6460" },
};

export const RELATIONSHIP_CONFIG: Record<
  RelationshipTag,
  { label: string; icon: string }
> = {
  spouse: { label: "Vợ/Chồng", icon: "💑" },
  parent: { label: "Bố/Mẹ", icon: "👨‍👩‍👧" },
  child: { label: "Con", icon: "👶" },
  sibling: { label: "Anh/Chị/Em", icon: "👫" },
  friend: { label: "Bạn bè", icon: "🤝" },
  boss: { label: "Sếp", icon: "👔" },
  colleague: { label: "Đồng nghiệp", icon: "💼" },
  partner: { label: "Đối tác", icon: "🤝" },
  client: { label: "Khách hàng", icon: "🏢" },
  other: { label: "Khác", icon: "👤" },
};

export const PAYMENT_METHOD_CONFIG: Record<
  GiftPaymentMethod,
  { label: string; icon: string }
> = {
  wallet: { label: "Ví HLT", icon: "💰" },
  bank_transfer: { label: "Chuyển khoản", icon: "🏦" },
  cod: { label: "Thanh toán khi nhận", icon: "💵" },
  momo: { label: "MoMo", icon: "📱" },
};

export const ORDER_STATUS_CONFIG: Record<
  GiftOrderStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Nháp", color: "#9A9490", bgColor: "#F5F3F0" },
  pending: { label: "Chờ xác nhận", color: "#E8A44E", bgColor: "#FEF8E8" },
  confirmed: { label: "Đã xác nhận", color: "#2C5F8A", bgColor: "#E8F0F8" },
  preparing: { label: "Đang chuẩn bị", color: "#C9A96E", bgColor: "#FDF8F0" },
  delivering: { label: "Đang giao", color: "#D45C8A", bgColor: "#F8EDF2" },
  delivered: { label: "Đã giao", color: "#3A7D54", bgColor: "#E8F5ED" },
  cancelled: { label: "Đã hủy", color: "#9E3A3A", bgColor: "#F8EDED" },
};

export const SUBSCRIPTION_STATUS_CONFIG: Record<
  GiftSubscriptionStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "Đang hoạt động", color: "#3A7D54", bgColor: "#E8F5ED" },
  paused: { label: "Tạm dừng", color: "#E8A44E", bgColor: "#FEF8E8" },
  cancelled: { label: "Đã hủy", color: "#9E3A3A", bgColor: "#F8EDED" },
  expired: { label: "Hết hạn", color: "#9A9490", bgColor: "#F5F3F0" },
};

export const FREQUENCY_CONFIG: Record<
  GiftSubscriptionFrequency,
  { label: string; days: number }
> = {
  weekly: { label: "Hàng tuần", days: 7 },
  biweekly: { label: "2 tuần/lần", days: 14 },
  monthly: { label: "Hàng tháng", days: 30 },
};

export const LOYALTY_TIER_CONFIG: Record<
  GiftLoyaltyTier,
  { label: string; icon: string; color: string; minSpend: number; multiplier: number }
> = {
  silver: { label: "Bạc", icon: "🥈", color: "#9A9490", minSpend: 0, multiplier: 1 },
  gold: { label: "Vàng", icon: "🥇", color: "#C9A96E", minSpend: 2000000, multiplier: 1.5 },
  diamond: { label: "Kim Cương", icon: "💎", color: "#2C5F8A", minSpend: 5000000, multiplier: 2 },
};

export const PAYMENT_STATUS_CONFIG: Record<
  GiftPaymentStatus,
  { label: string; color: string; bgColor: string }
> = {
  unpaid: { label: "Chưa thanh toán", color: "#9E3A3A", bgColor: "#F8EDED" },
  partial: { label: "Thanh toán một phần", color: "#E8A44E", bgColor: "#FEF8E8" },
  paid: { label: "Đã thanh toán", color: "#3A7D54", bgColor: "#E8F5ED" },
  refunded: { label: "Đã hoàn tiền", color: "#9A9490", bgColor: "#F5F3F0" },
};
