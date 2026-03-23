CREATE OR REPLACE FUNCTION handle_gift_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'gift_platform' = 'true' THEN
    INSERT INTO gift_profiles (id, email, full_name, phone, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'phone',
      'individual'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO gift_wallets (profile_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
