-- HLT Gift Platform — Initial Schema
-- All tables prefixed with gift_ to avoid conflicts with CRM tables
-- Run in Supabase SQL Editor

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE gift_user_role AS ENUM ('individual', 'business', 'admin');
CREATE TYPE gift_occasion_type AS ENUM ('birthday', 'anniversary', 'opening', 'congrats', 'holiday', 'women', 'teacher', 'tet', 'custom');
CREATE TYPE gift_order_status AS ENUM ('draft', 'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled');
CREATE TYPE gift_payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded');
CREATE TYPE gift_wallet_tx_type AS ENUM ('topup', 'purchase', 'refund', 'bonus', 'adjustment');
CREATE TYPE gift_relationship_tag AS ENUM ('spouse', 'parent', 'child', 'sibling', 'friend', 'boss', 'colleague', 'partner', 'client', 'other');

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE gift_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role gift_user_role NOT NULL DEFAULT 'individual',
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  company_name TEXT,
  company_tax_code TEXT,
  company_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_profiles_phone ON gift_profiles(phone);
CREATE INDEX idx_gift_profiles_role ON gift_profiles(role);

-- ============================================================
-- 2. WALLETS (one per profile)
-- ============================================================
CREATE TABLE gift_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES gift_profiles(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,
  total_topup BIGINT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. TRANSACTIONS (wallet ledger)
-- ============================================================
CREATE TABLE gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES gift_wallets(id) ON DELETE CASCADE,
  type gift_wallet_tx_type NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  reference TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_tx_wallet ON gift_transactions(wallet_id);
CREATE INDEX idx_gift_tx_created ON gift_transactions(created_at DESC);

-- ============================================================
-- 4. COMBO TIERS (gift product catalog)
-- ============================================================
CREATE TABLE gift_combo_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price BIGINT NOT NULL DEFAULT 0,
  includes JSONB DEFAULT '[]',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default tiers
INSERT INTO gift_combo_tiers (name, slug, description, price, includes, sort_order) VALUES
  ('Tinh Tế', 'tinh-te', 'Hoa tươi nhập khẩu + thiệp viết tay', 500000, '["Hoa tươi nhập khẩu", "Thiệp viết tay"]', 1),
  ('Yêu Thương', 'yeu-thuong', 'Hoa tươi + bánh kem + thiệp AI', 800000, '["Hoa tươi nhập khẩu", "Bánh kem 16cm", "Thiệp AI personalized"]', 2),
  ('Sang Trọng', 'sang-trong', 'Hoa cao cấp + bánh + thiệp + quà', 1200000, '["Hoa nhập khẩu premium", "Bánh kem 20cm", "Thiệp thiết kế riêng", "Hộp quà & nến thơm"]', 3);

-- ============================================================
-- 5. RECIPIENTS (people who receive gifts)
-- ============================================================
CREATE TABLE gift_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES gift_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship gift_relationship_tag DEFAULT 'other',
  address TEXT,
  district TEXT,
  city TEXT DEFAULT 'Hà Nội',
  note TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_recipients_profile ON gift_recipients(profile_id);

-- ============================================================
-- 6. OCCASIONS (recurring events per recipient)
-- ============================================================
CREATE TABLE gift_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES gift_recipients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES gift_profiles(id) ON DELETE CASCADE,
  type gift_occasion_type NOT NULL,
  label TEXT,
  date_day INT NOT NULL CHECK (date_day BETWEEN 1 AND 31),
  date_month INT NOT NULL CHECK (date_month BETWEEN 1 AND 12),
  date_year INT,
  is_lunar BOOLEAN DEFAULT false,
  remind_days_before INT DEFAULT 7,
  auto_order BOOLEAN DEFAULT false,
  preferred_combo_id UUID REFERENCES gift_combo_tiers(id),
  preferred_budget BIGINT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_occasions_recipient ON gift_occasions(recipient_id);
CREATE INDEX idx_gift_occasions_profile ON gift_occasions(profile_id);
CREATE INDEX idx_gift_occasions_date ON gift_occasions(date_month, date_day);

-- ============================================================
-- 7. CARD TEMPLATES
-- ============================================================
CREATE TABLE gift_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  occasion_type gift_occasion_type,
  thumbnail_url TEXT,
  template_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default templates
INSERT INTO gift_card_templates (name, occasion_type, template_data, is_active) VALUES
  ('Sinh nhật Ấm Áp', 'birthday', '{"style": "warm", "bgColor": "#FDF8F0"}', true),
  ('Khai trương Hồng Phát', 'opening', '{"style": "festive", "bgColor": "#FEF0F0"}', true),
  ('Chúc mừng Thành Công', 'congrats', '{"style": "elegant", "bgColor": "#F0F8F0"}', true),
  ('Lễ Tết An Khang', 'holiday', '{"style": "traditional", "bgColor": "#FEF8E8"}', true),
  ('Phụ Nữ Kiêu Hãnh', 'women', '{"style": "romantic", "bgColor": "#F8EDF2"}', true);

-- ============================================================
-- 8. ORDERS
-- ============================================================
CREATE TABLE gift_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  profile_id UUID NOT NULL REFERENCES gift_profiles(id),
  recipient_id UUID REFERENCES gift_recipients(id),
  occasion_id UUID REFERENCES gift_occasions(id),
  combo_tier_id UUID REFERENCES gift_combo_tiers(id),
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  delivery_address TEXT,
  delivery_district TEXT,
  delivery_date TIMESTAMPTZ,
  delivery_time TEXT,
  delivery_note TEXT,
  delivery_photo_url TEXT,
  subtotal BIGINT DEFAULT 0,
  discount BIGINT DEFAULT 0,
  total BIGINT DEFAULT 0,
  payment_status gift_payment_status DEFAULT 'unpaid',
  card_message TEXT,
  card_template_id UUID REFERENCES gift_card_templates(id),
  status gift_order_status DEFAULT 'draft',
  timeline JSONB DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_orders_profile ON gift_orders(profile_id);
CREATE INDEX idx_gift_orders_status ON gift_orders(status);
CREATE INDEX idx_gift_orders_delivery ON gift_orders(delivery_date);

-- ============================================================
-- 9. CARDS (generated greeting cards)
-- ============================================================
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES gift_orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES gift_card_templates(id),
  message TEXT,
  image_url TEXT,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_cards_order ON gift_cards(order_id);

-- ============================================================
-- 10. REFERRALS
-- ============================================================
CREATE TABLE gift_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES gift_profiles(id),
  referred_id UUID REFERENCES gift_profiles(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  bonus_amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_referrals_code ON gift_referrals(referral_code);

-- ============================================================
-- 11. NOTIFICATION LOG
-- ============================================================
CREATE TABLE gift_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES gift_profiles(id),
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'sent',
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_notif_profile ON gift_notification_log(profile_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE gift_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON gift_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON gift_profiles FOR UPDATE USING (id = auth.uid());

-- Wallets (read only via RLS, mutations via service_role)
ALTER TABLE gift_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wallet" ON gift_wallets FOR SELECT USING (profile_id = auth.uid());

-- Transactions
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transactions" ON gift_transactions FOR SELECT
  USING (wallet_id IN (SELECT id FROM gift_wallets WHERE profile_id = auth.uid()));

-- Combo tiers (public read)
ALTER TABLE gift_combo_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active combos" ON gift_combo_tiers FOR SELECT USING (is_active = true);

-- Card templates (public read)
ALTER TABLE gift_card_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active templates" ON gift_card_templates FOR SELECT USING (is_active = true);

-- Recipients
ALTER TABLE gift_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recipients" ON gift_recipients FOR ALL USING (profile_id = auth.uid());

-- Occasions
ALTER TABLE gift_occasions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own occasions" ON gift_occasions FOR ALL USING (profile_id = auth.uid());

-- Orders
ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own orders" ON gift_orders FOR ALL USING (profile_id = auth.uid());

-- Cards (through orders)
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own cards" ON gift_cards FOR SELECT
  USING (order_id IN (SELECT id FROM gift_orders WHERE profile_id = auth.uid()));

-- Referrals
ALTER TABLE gift_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own referrals" ON gift_referrals FOR SELECT USING (referrer_id = auth.uid());
CREATE POLICY "Anyone can create referral" ON gift_referrals FOR INSERT WITH CHECK (true);

-- Notification log
ALTER TABLE gift_notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON gift_notification_log FOR SELECT USING (profile_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile + wallet when a gift platform user signs up
CREATE OR REPLACE FUNCTION handle_gift_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create for gift platform signups
  IF NEW.raw_user_meta_data->>'gift_platform' = 'true' THEN
    INSERT INTO gift_profiles (id, email, full_name, phone, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'phone',
      COALESCE((NEW.raw_user_meta_data->>'role')::gift_user_role, 'individual')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO gift_wallets (profile_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_gift
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_gift_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION gift_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_profiles_updated_at BEFORE UPDATE ON gift_profiles FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();
CREATE TRIGGER gift_wallets_updated_at BEFORE UPDATE ON gift_wallets FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();
CREATE TRIGGER gift_recipients_updated_at BEFORE UPDATE ON gift_recipients FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();
CREATE TRIGGER gift_occasions_updated_at BEFORE UPDATE ON gift_occasions FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();
CREATE TRIGGER gift_orders_updated_at BEFORE UPDATE ON gift_orders FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();
CREATE TRIGGER gift_combo_tiers_updated_at BEFORE UPDATE ON gift_combo_tiers FOR EACH ROW EXECUTE FUNCTION gift_update_updated_at();

-- ============================================================
-- WALLET FUNCTIONS (atomic operations)
-- ============================================================

-- Topup wallet
CREATE OR REPLACE FUNCTION gift_wallet_topup(
  p_wallet_id UUID,
  p_amount BIGINT,
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  UPDATE gift_wallets
  SET balance = balance + p_amount,
      total_topup = total_topup + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id
  RETURNING balance INTO new_balance;

  INSERT INTO gift_transactions (wallet_id, type, amount, balance_after, reference, description, metadata)
  VALUES (p_wallet_id, 'topup', p_amount, new_balance, p_reference, p_description, p_metadata);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Charge wallet (fails if insufficient balance)
CREATE OR REPLACE FUNCTION gift_wallet_charge(
  p_wallet_id UUID,
  p_amount BIGINT,
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  current_bal BIGINT;
  new_balance BIGINT;
BEGIN
  SELECT balance INTO current_bal FROM gift_wallets WHERE id = p_wallet_id FOR UPDATE;

  IF current_bal < p_amount THEN
    RAISE EXCEPTION 'Số dư không đủ: có %đ, cần %đ', current_bal, p_amount;
  END IF;

  new_balance := current_bal - p_amount;

  UPDATE gift_wallets
  SET balance = new_balance,
      total_spent = total_spent + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  INSERT INTO gift_transactions (wallet_id, type, amount, balance_after, reference, description)
  VALUES (p_wallet_id, 'purchase', -p_amount, new_balance, p_reference, p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
