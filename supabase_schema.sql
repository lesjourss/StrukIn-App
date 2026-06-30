-- =======================================================
-- SQL SCHEMA UNTUK APLIKASI STRUKIN (EXPENSE TRACKER)
-- Jalankan script ini di SQL Editor Supabase Anda.
-- =======================================================

-- 1. Buat tabel Profiles yang terhubung ke auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(12, 2) DEFAULT NULL,
  ai_character VARCHAR(50) DEFAULT 'Dosen Killer', -- 'Dosen Killer', 'Emak Bawel', 'Teman Santai'
  ai_spiciness VARCHAR(20) DEFAULT 'Sedang', -- 'Manis', 'Sedang', 'Pedes Mampus'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) pada tabel Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Buat policy agar user hanya bisa membaca & mengubah profil mereka sendiri
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Buat tabel Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'Makan', 'Transport', 'Lifestyle', 'Kesehatan', 'Hiburan', 'Lainnya'
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  source_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'scan', 'ai_chat'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan RLS pada tabel Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk tabel Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Fungsi & Trigger Otomatis untuk membuat profil saat user baru terdaftar (termasuk Google Login)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, monthly_limit, ai_character, ai_spiciness)
  VALUES (new.id, NULL, 'Dosen Killer', 'Sedang');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
