-- P1 Schema: Unwrapping, Subscriptions, Loyalty, Delivery, Daily Stats

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE gift_subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE gift_subscription_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE gift_loyalty_tier AS ENUM ('silver', 'gold', 'diamond');

-- ============================================================
-- A3: GIFT UNWRAPPING
-- ============================================================
CREATE TABLE gift_unwrap_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES gift_orders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  recipient_viewed_at TIMESTAMPTZ,
  recipient_response TEXT,
  recipient_choice_id UUID,
  address_confirmed BOOLEAN DEFAULT false,
  confirmed_address TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_unwrap_token ON gift_unwrap_tokens(token);
CREATE INDEX idx_gift_unwrap_order ON gift_unwrap_tokens(order_id);

CREATE TABLE gift_unwrap_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES gift_unwrap_tokens(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public read for unwrap tokens (no auth needed)
ALTER TABLE gift_unwrap_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read unwrap tokens" ON gift_unwrap_tokens FOR SELECT USING (true);
CREATE POLICY "Service insert unwrap tokens" ON gift_unwrap_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update unwrap tokens" ON gift_unwrap_tokens FOR UPDATE USING (true);

ALTER TABLE gift_unwrap_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read unwrap events" ON gift_unwrap_events FOR SELECT USING (true);
CREATE POLICY "Service insert unwrap events" ON gift_unwrap_events FOR INSERT WITH CHECK (true);

-- ============================================================
-- A4: SUBSCRIPTIONS
-- ============================================================
CREATE TABLE gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES gift_profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES gift_recipients(id) ON DELETE CASCADE,
  combo_tier_id UUID NOT NULL REFERENCES gift_combo_tiers(id),
  frequency gift_subscription_frequency NOT NULL,
  status gift_subscription_status NOT NULL DEFAULT 'active',
  delivery_address TEXT,
  delivery_district TEXT,
  delivery_city TEXT DEFAULT 'Hà Nội',
  delivery_time TEXT DEFAULT '09:00-12:00',
  card_message TEXT,
  next_delivery_date DATE NOT NULL,
  commitment_months INT DEFAULT 0,
  discount_percent INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  skipped_count INT DEFAULT 0,
  paused_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_sub_profile ON gift_subscriptions(profile_id);
CREATE INDEX idx_gift_sub_status ON gift_subscriptions(status);
CREATE INDEX idx_gift_sub_next ON gift_subscriptions(next_delivery_date);

CREATE TABLE gift_subscription_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES gift_subscriptions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES gift_orders(id),
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  skip_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_sub_del_sub ON gift_subscription_deliveries(subscription_id);
CREATE INDEX idx_gift_sub_del_date ON gift_subscription_deliveries(scheduled_date);

-- RLS
ALTER TABLE gift_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON gift_subscriptions FOR ALL USING (profile_id = auth.uid());

ALTER TABLE gift_subscription_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription deliveries" ON gift_subscription_deliveries FOR SELECT
  USING (subscription_id IN (SELECT id FROM gift_subscriptions WHERE profile_id = auth.uid()));

-- Trigger
CREATE TRIGGER gift_subscriptions_updated_at BEFORE UPDATE ON gift_subscriptions FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();

-- ============================================================
-- A5: LOYALTY & REFERRAL
-- ============================================================
CREATE TABLE gift_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES gift_profiles(id) ON DELETE CASCADE,
  tier gift_loyalty_tier NOT NULL DEFAULT 'silver',
  points_balance BIGINT NOT NULL DEFAULT 0,
  points_earned_total BIGINT NOT NULL DEFAULT 0,
  points_redeemed_total BIGINT NOT NULL DEFAULT 0,
  lifetime_spend BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gift_loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_account_id UUID NOT NULL REFERENCES gift_loyalty_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  points BIGINT NOT NULL,
  reference_id UUID,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_loyalty_profile ON gift_loyalty_accounts(profile_id);
CREATE INDEX idx_gift_loyalty_tx_account ON gift_loyalty_transactions(loyalty_account_id);

-- RLS
ALTER TABLE gift_loyalty_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own loyalty" ON gift_loyalty_accounts FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Service manage loyalty" ON gift_loyalty_accounts FOR ALL USING (true);

ALTER TABLE gift_loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own loyalty tx" ON gift_loyalty_transactions FOR SELECT
  USING (loyalty_account_id IN (SELECT id FROM gift_loyalty_accounts WHERE profile_id = auth.uid()));
CREATE POLICY "Service insert loyalty tx" ON gift_loyalty_transactions FOR INSERT WITH CHECK (true);

-- Trigger
CREATE TRIGGER gift_loyalty_accounts_updated_at BEFORE UPDATE ON gift_loyalty_accounts FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();

-- Enhance referrals
ALTER TABLE gift_referrals ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'wallet_credit';
ALTER TABLE gift_referrals ADD COLUMN IF NOT EXISTS reward_amount BIGINT DEFAULT 50000;
ALTER TABLE gift_referrals ADD COLUMN IF NOT EXISTS referrer_rewarded BOOLEAN DEFAULT false;
ALTER TABLE gift_referrals ADD COLUMN IF NOT EXISTS referred_rewarded BOOLEAN DEFAULT false;
ALTER TABLE gift_referrals ADD COLUMN IF NOT EXISTS referred_first_order_id UUID REFERENCES gift_orders(id);

-- ============================================================
-- B5: DELIVERY MANAGEMENT
-- ============================================================
CREATE TABLE gift_delivery_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_zones JSONB DEFAULT '[]',
  max_daily_orders INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gift_delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_code TEXT NOT NULL UNIQUE,
  district_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Hà Nội',
  delivery_fee BIGINT DEFAULT 0,
  same_day_available BOOLEAN DEFAULT true,
  same_day_cutoff TEXT DEFAULT '14:00',
  max_daily_capacity INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (admin-only via service role, no public access)
ALTER TABLE gift_delivery_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manage delivery staff" ON gift_delivery_staff FOR ALL USING (true);

ALTER TABLE gift_delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active zones" ON gift_delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Service manage zones" ON gift_delivery_zones FOR ALL USING (true);

-- Seed Hanoi delivery zones
INSERT INTO gift_delivery_zones (district_code, district_name, delivery_fee, sort_order) VALUES
  ('hoan-kiem', 'Hoàn Kiếm', 0, 1),
  ('ba-dinh', 'Ba Đình', 0, 2),
  ('dong-da', 'Đống Đa', 0, 3),
  ('hai-ba-trung', 'Hai Bà Trưng', 0, 4),
  ('cau-giay', 'Cầu Giấy', 0, 5),
  ('thanh-xuan', 'Thanh Xuân', 0, 6),
  ('tay-ho', 'Tây Hồ', 0, 7),
  ('long-bien', 'Long Biên', 20000, 8),
  ('nam-tu-liem', 'Nam Từ Liêm', 20000, 9),
  ('bac-tu-liem', 'Bắc Từ Liêm', 20000, 10),
  ('hoang-mai', 'Hoàng Mai', 20000, 11),
  ('ha-dong', 'Hà Đông', 30000, 12);

-- ============================================================
-- B4: DAILY STATS
-- ============================================================
CREATE TABLE gift_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_orders INT DEFAULT 0,
  total_revenue BIGINT DEFAULT 0,
  total_topup BIGINT DEFAULT 0,
  new_clients INT DEFAULT 0,
  active_subscriptions INT DEFAULT 0,
  orders_by_combo JSONB DEFAULT '{}',
  orders_by_occasion JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gift_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manage daily stats" ON gift_daily_stats FOR ALL USING (true);

-- ============================================================
-- NOTIFICATION LOG enhancements
-- ============================================================
ALTER TABLE gift_notification_log ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE gift_notification_log ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE gift_notification_log ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE gift_notification_log ADD COLUMN IF NOT EXISTS category TEXT;
