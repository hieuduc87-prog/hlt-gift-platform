-- P0 Schema Updates: Order Flow + Catalog + Client CRM
-- New columns on existing tables + 1 new table

-- ============================================================
-- 1. gift_orders — new columns for full order lifecycle
-- ============================================================
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'wallet';
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS delivery_fee BIGINT DEFAULT 0;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS delivery_city TEXT DEFAULT 'Hà Nội';
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES gift_profiles(id);
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS internal_note TEXT;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS delivery_photos JSONB DEFAULT '[]';
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS promotion_id UUID;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS promotion_code TEXT;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS promotion_discount BIGINT DEFAULT 0;
ALTER TABLE gift_orders ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

-- ============================================================
-- 2. gift_combo_tiers — catalog enhancements
-- ============================================================
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS occasion_types JSONB DEFAULT '[]';
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS seasonal_start DATE;
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS seasonal_end DATE;
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS max_orders_per_day INT;
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS delivery_areas JSONB DEFAULT '["Hà Nội"]';
ALTER TABLE gift_combo_tiers ADD COLUMN IF NOT EXISTS popularity_score INT DEFAULT 0;

-- ============================================================
-- 3. gift_profiles — CRM enhancements
-- ============================================================
ALTER TABLE gift_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE gift_profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE gift_profiles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'organic';

-- ============================================================
-- 4. gift_order_timeline_events — order status audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS gift_order_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES gift_orders(id) ON DELETE CASCADE,
  status gift_order_status NOT NULL,
  actor_id UUID REFERENCES gift_profiles(id),
  actor_type TEXT DEFAULT 'staff',
  note TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_timeline_order ON gift_order_timeline_events(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_timeline_created ON gift_order_timeline_events(created_at DESC);

-- RLS
ALTER TABLE gift_order_timeline_events ENABLE ROW LEVEL SECURITY;

-- Buyers can read timeline for their own orders
CREATE POLICY "Users read own order timeline" ON gift_order_timeline_events FOR SELECT
  USING (order_id IN (SELECT id FROM gift_orders WHERE profile_id = auth.uid()));

-- Service role can insert (admin operations)
CREATE POLICY "Service inserts timeline" ON gift_order_timeline_events FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. Wallet refund function
-- ============================================================
CREATE OR REPLACE FUNCTION gift_wallet_refund(
  p_wallet_id UUID,
  p_amount BIGINT,
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  UPDATE gift_wallets
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id
  RETURNING balance INTO new_balance;

  INSERT INTO gift_transactions (wallet_id, type, amount, balance_after, reference, description)
  VALUES (p_wallet_id, 'refund', p_amount, new_balance, p_reference, p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
