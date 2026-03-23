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
  created_at: string;
  updated_at: string;
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
  subtotal: number;
  discount: number;
  total: number;
  payment_status: GiftPaymentStatus;
  card_message: string | null;
  card_template_id: string | null;
  status: GiftOrderStatus;
  timeline: Record<string, unknown>[];
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
