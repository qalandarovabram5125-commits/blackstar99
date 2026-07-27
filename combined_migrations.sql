
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student','teacher','librarian','vice_principal','admin','superadmin');

-- ============ HELPER: updated_at ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE,
  telegram_username TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  class_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manages roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));

-- ============ SITE SETTINGS (single row) ============
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  school_name TEXT NOT NULL DEFAULT '41-maktab',
  motto TEXT NOT NULL DEFAULT 'Bilim — kelajak kaliti',
  hero_image_url TEXT,
  address TEXT DEFAULT 'Toshkent shahri',
  phone TEXT DEFAULT '+998 71 000 00 00',
  email TEXT DEFAULT 'info@41maktab.uz',
  latitude DOUBLE PRECISION DEFAULT 41.2995,
  longitude DOUBLE PRECISION DEFAULT 69.2401,
  stat_students INT NOT NULL DEFAULT 1240,
  stat_teachers INT NOT NULL DEFAULT 86,
  stat_workers INT NOT NULL DEFAULT 24,
  stat_university_pct INT NOT NULL DEFAULT 92,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT UPDATE ON public.site_settings TO authenticated;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
INSERT INTO public.site_settings (id) VALUES (1);

-- ============ NEWS ============
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News public read" ON public.news FOR SELECT USING (true);
CREATE POLICY "Admins manage news" ON public.news FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events public read" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ CERTIFICATES ============
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  class_name TEXT,
  subject TEXT,
  level TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates public read" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));

-- ============ GALLERY ============
CREATE TABLE public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery public read" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Authenticated upload to gallery" ON public.gallery_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Owner or moderator delete" ON public.gallery_items FOR DELETE TO authenticated USING (auth.uid() = uploader_id OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "Owner or moderator update" ON public.gallery_items FOR UPDATE TO authenticated USING (auth.uid() = uploader_id OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));

-- Likes (gallery + certificates)
CREATE TABLE public.gallery_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.gallery_likes TO authenticated;
GRANT ALL ON public.gallery_likes TO service_role;
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes public read" ON public.gallery_likes FOR SELECT USING (true);
CREATE POLICY "Like own" ON public.gallery_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike own" ON public.gallery_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.certificate_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, certificate_id)
);
GRANT SELECT, INSERT, DELETE ON public.certificate_likes TO authenticated;
GRANT ALL ON public.certificate_likes TO service_role;
ALTER TABLE public.certificate_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cert likes read" ON public.certificate_likes FOR SELECT USING (true);
CREATE POLICY "Cert like own" ON public.certificate_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cert unlike own" ON public.certificate_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Like counter triggers
CREATE OR REPLACE FUNCTION public.tg_gallery_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.gallery_items SET likes_count = likes_count + 1 WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.gallery_items SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.item_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_gallery_like_count AFTER INSERT OR DELETE ON public.gallery_likes FOR EACH ROW EXECUTE FUNCTION public.tg_gallery_like_count();

CREATE OR REPLACE FUNCTION public.tg_cert_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.certificates SET likes_count = likes_count + 1 WHERE id = NEW.certificate_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.certificates SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.certificate_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_cert_like_count AFTER INSERT OR DELETE ON public.certificate_likes FOR EACH ROW EXECUTE FUNCTION public.tg_cert_like_count();

-- ============ LIBRARY ============
CREATE TABLE public.library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  subject TEXT,
  class_name TEXT,
  description TEXT,
  cover_url TEXT,
  file_url TEXT NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Books public read" ON public.library_books FOR SELECT USING (true);
CREATE POLICY "Librarians manage books" ON public.library_books FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['librarian','admin','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['librarian','admin','superadmin']::app_role[]));

-- ============ SCHEDULE ============
CREATE TABLE public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period_no SMALLINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schedule_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedule_entries TO authenticated;
GRANT ALL ON public.schedule_entries TO service_role;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedule public read" ON public.schedule_entries FOR SELECT USING (true);
CREATE POLICY "Schedule managers" ON public.schedule_entries FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','vice_principal','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','vice_principal','superadmin']::app_role[]));
CREATE TRIGGER trg_sched_updated BEFORE UPDATE ON public.schedule_entries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ PROUD STUDENTS ============
CREATE TABLE public.proud_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  photo_url TEXT,
  achievement TEXT NOT NULL,
  year INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proud_students TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.proud_students TO authenticated;
GRANT ALL ON public.proud_students TO service_role;
ALTER TABLE public.proud_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Proud public read" ON public.proud_students FOR SELECT USING (true);
CREATE POLICY "Admins manage proud" ON public.proud_students FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));

-- ============ SEED DEMO DATA ============
INSERT INTO public.news (title, excerpt, content, cover_url) VALUES
('Yangi o''quv yili boshlandi','2025–2026 o''quv yili tantanali ochildi','41-maktabda yangi o''quv yili tantanali marosim bilan ochildi. Barcha o''quvchilar va o''qituvchilarni qutlaymiz!', null),
('Matematika olimpiadasi g''oliblari','Shahar bosqichida 3 ta oltin medal','O''quvchilarimiz shahar matematika olimpiadasida 3 oltin va 2 kumush medalni qo''lga kiritdi.', null),
('Kitobxonlik tanlovi','Mart oyi yakunlari','Mart oyi davomida o''tkazilgan kitobxonlik tanlovida 10-sinflar g''olib bo''ldi.', null);

INSERT INTO public.events (title, description, location, starts_at) VALUES
('Bilim kuni','Yangi o''quv yili tantanasi','Maktab maydoni', now() + interval '7 days'),
('Ota-onalar yig''ilishi','Sinflar bo''yicha umumiy yig''ilish','Aktovaya zal', now() + interval '14 days'),
('Sport bayrami','Yillik sport musobaqalari','Sport zal', now() + interval '21 days');

INSERT INTO public.certificates (image_url, recipient_name, class_name, subject, level) VALUES
('', 'Aliyev Akmal','11-A','Matematika','Xalqaro'),
('', 'Karimova Madina','10-B','Fizika','Respublika'),
('', 'Tursunov Bekzod','9-A','Informatika','Shahar'),
('', 'Rahimova Sevinch','11-B','Kimyo','Respublika');

INSERT INTO public.proud_students (full_name, achievement, year, sort_order) VALUES
('Aliyev Akmal','MIT talabasi', 2024, 1),
('Karimova Madina','Prezident maktabi g''olibi', 2024, 2),
('Tursunov Bekzod','Xalqaro IT olimpiadasi sovrindori', 2023, 3),
('Rahimova Sevinch','Kembrij universiteti talabasi', 2024, 4),
('Yusupov Ja''far','Respublika fizika olimpiadasi g''olibi', 2023, 5),
('Salimova Nilufar','Tibbiyot akademiyasi talabasi', 2024, 6);

INSERT INTO public.library_books (title, author, subject, class_name, description, file_url) VALUES
('Matematika 5-sinf','M. Mirzaahmedov','Matematika','5-sinf','Asosiy darslik','https://example.com/math5.pdf'),
('Ona tili 7-sinf','N. Mahmudov','Ona tili','7-sinf','Darslik','https://example.com/onatili7.pdf'),
('Fizika 9-sinf','P. Habibullayev','Fizika','9-sinf','Darslik','https://example.com/fizika9.pdf'),
('Tarix 11-sinf','Q. Usmonov','Tarix','11-sinf','Darslik','https://example.com/tarix11.pdf');

INSERT INTO public.schedule_entries (class_name, day_of_week, period_no, start_time, end_time, subject, teacher_name, room) VALUES
('10-A',1,1,'08:30','09:15','Matematika','Karimov A.','201'),
('10-A',1,2,'09:25','10:10','Fizika','Yusupov B.','305'),
('10-A',1,3,'10:20','11:05','Ingliz tili','Aliyeva M.','108'),
('10-A',1,4,'11:25','12:10','Adabiyot','Soliyev Z.','204'),
('10-A',2,1,'08:30','09:15','Kimyo','Rahimova N.','302'),
('10-A',2,2,'09:25','10:10','Tarix','Usmonov Q.','110');

-- Trigger helpers don't need elevated privileges
ALTER FUNCTION public.tg_set_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.tg_gallery_like_count() SECURITY INVOKER;
ALTER FUNCTION public.tg_cert_like_count() SECURITY INVOKER;

-- Like-count triggers need write privilege regardless of caller — owner has it, but invoker may not.
-- Re-grant table privileges to authenticated (already granted) and rely on owner being postgres.
-- Keep has_role / has_any_role as DEFINER but restrict EXECUTE to authenticated only (RLS engine runs as authenticated).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;

-- Trigger helpers: revoke direct execution from clients
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_gallery_like_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_cert_like_count() FROM PUBLIC, anon, authenticated;

-- Trigger: create profile + assign SuperAdmin to bootstrap email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role: student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Bootstrap superadmin by email
  IF lower(NEW.email) = lower('buiejw2thde5ub@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: return current user's roles as text[]
CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role::text), ARRAY[]::text[])
  FROM public.user_roles
  WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, v_full_name, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) = lower('buiejw2thde5ub@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_group boolean NOT NULL DEFAULT true,
  avatar_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_members (
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
CREATE INDEX idx_chat_members_user ON public.chat_members(user_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  attachment_url text,
  attachment_name text,
  attachment_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_rooms, public.chat_members, public.chat_messages TO service_role;

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_member(_room uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.chat_members WHERE room_id = _room AND user_id = _user);
$$;

CREATE POLICY "members see rooms" ON public.chat_rooms FOR SELECT TO authenticated
  USING (public.is_room_member(id, auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "auth create rooms" ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "room admins update" ON public.chat_rooms FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "room admins delete" ON public.chat_rooms FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));

CREATE POLICY "see members" ON public.chat_members FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "join rooms" ON public.chat_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "update membership" ON public.chat_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "leave room" ON public.chat_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));

CREATE POLICY "members read msg" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));
CREATE POLICY "members send msg" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_room_member(room_id, auth.uid()));
CREATE POLICY "sender or admin delete msg" ON public.chat_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

CREATE TRIGGER tg_chat_rooms_updated BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_add_creator_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.chat_members(room_id, user_id, is_admin)
    VALUES (NEW.id, NEW.created_by, true) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_chat_room_creator AFTER INSERT ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.tg_add_creator_as_member();

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin reads audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE OR REPLACE FUNCTION public.log_action(_action text, _entity text DEFAULT NULL, _entity_id text DEFAULT NULL, _meta jsonb DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (auth.uid(), v_email, _action, _entity, _entity_id, _meta);
END $$;
GRANT EXECUTE ON FUNCTION public.log_action(text, text, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_analytics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[]) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT jsonb_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'news', (SELECT count(*) FROM public.news),
    'events', (SELECT count(*) FROM public.events),
    'certificates', (SELECT count(*) FROM public.certificates),
    'gallery', (SELECT count(*) FROM public.gallery_items),
    'books', (SELECT count(*) FROM public.library_books),
    'rooms', (SELECT count(*) FROM public.chat_rooms),
    'messages', (SELECT count(*) FROM public.chat_messages),
    'messages_24h', (SELECT count(*) FROM public.chat_messages WHERE created_at > now() - interval '24 hours'),
    'new_users_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'audit_24h', (SELECT count(*) FROM public.audit_logs WHERE created_at > now() - interval '24 hours'),
    'roles', (SELECT jsonb_object_agg(role, c) FROM (SELECT role::text, count(*) c FROM public.user_roles GROUP BY role) x)
  ) INTO v;
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_analytics() TO authenticated;

CREATE POLICY "read chat-files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-files');
CREATE POLICY "upload chat-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-files' AND owner = auth.uid());
CREATE POLICY "del chat-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat-files' AND owner = auth.uid());

CREATE POLICY "read gallery" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'gallery');
CREATE POLICY "upload gallery" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND owner = auth.uid());
CREATE POLICY "del gallery" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin']::app_role[])));

CREATE POLICY "read library" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'library');
CREATE POLICY "upload library" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'library' AND owner = auth.uid());
CREATE POLICY "del library" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'library' AND (owner = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','superadmin','librarian']::app_role[])));

-- Allow admins to insert site_settings (upsert needs this)
CREATE POLICY "Admins insert settings" ON public.site_settings
FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role]));

-- Ensure row id=1 exists so update path works too
INSERT INTO public.site_settings (id, school_name, motto)
VALUES (1, '41-maktab', 'Bilim — kelajak kaliti')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Media public read" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND (
  has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
  OR (storage.foldername(name))[1] = 'avatars'
));

CREATE POLICY "Admins update media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND (
  has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
  OR owner = auth.uid()
));

CREATE POLICY "Admins delete media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media' AND (
  has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
  OR owner = auth.uid()
));
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS logo_url text;ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS admin_telegram_chat_id text;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.chat_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_join_requests TO authenticated;
GRANT ALL ON public.chat_join_requests TO service_role;
ALTER TABLE public.chat_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see own or owner" ON public.chat_join_requests FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = auth.uid())
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
);
CREATE POLICY "user requests" ON public.chat_join_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner updates" ON public.chat_join_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = auth.uid())
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
);
CREATE POLICY "owner deletes" ON public.chat_join_requests FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = auth.uid())
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
);

DROP TRIGGER IF EXISTS trg_room_creator_member ON public.chat_rooms;
CREATE TRIGGER trg_room_creator_member
AFTER INSERT ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.tg_add_creator_as_member();

DROP POLICY IF EXISTS "members see rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "see rooms" ON public.chat_rooms;
CREATE POLICY "see rooms" ON public.chat_rooms FOR SELECT TO authenticated
USING (
  is_room_member(id, auth.uid())
  OR (is_public = true AND is_group = true)
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
);

DROP POLICY IF EXISTS "join rooms" ON public.chat_members;
CREATE POLICY "join rooms" ON public.chat_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = auth.uid())
  OR has_any_role(auth.uid(), ARRAY['admin'::app_role,'superadmin'::app_role])
);

DROP POLICY IF EXISTS "profiles read all auth" ON public.profiles;
CREATE POLICY "profiles read all auth" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Public read for media bucket (so hero/logo images render without signing)
DROP POLICY IF EXISTS "public read media" ON storage.objects;
CREATE POLICY "public read media" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'media');

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_join_requests;

DROP POLICY IF EXISTS "auth create rooms" ON public.chat_rooms;
CREATE POLICY "auth create rooms" ON public.chat_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP TRIGGER IF EXISTS trg_room_creator_member ON public.chat_rooms;

ALTER TABLE public.chat_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.my_room_summaries()
RETURNS TABLE(
  room_id uuid,
  unread bigint,
  last_content text,
  last_at timestamptz,
  last_sender_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    cm.room_id,
    (SELECT count(*) FROM public.chat_messages m
       WHERE m.room_id = cm.room_id
         AND m.created_at > cm.last_read_at
         AND m.sender_id <> auth.uid()),
    (SELECT COALESCE(NULLIF(m.content, ''), CASE WHEN m.attachment_url IS NOT NULL THEN '📎 Fayl' ELSE '' END)
       FROM public.chat_messages m WHERE m.room_id = cm.room_id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT m.created_at FROM public.chat_messages m WHERE m.room_id = cm.room_id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT m.sender_id FROM public.chat_messages m WHERE m.room_id = cm.room_id ORDER BY m.created_at DESC LIMIT 1)
  FROM public.chat_members cm
  WHERE cm.user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_room_summaries() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_room_read(_room uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.chat_members SET last_read_at = now()
   WHERE room_id = _room AND user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.mark_room_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.gallery_item_likers(_item uuid)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, liked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT gl.user_id, p.full_name, p.avatar_url, gl.created_at
    FROM public.gallery_likes gl
    LEFT JOIN public.profiles p ON p.id = gl.user_id
   WHERE gl.item_id = _item
     AND public.has_role(auth.uid(), 'superadmin'::app_role)
   ORDER BY gl.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.gallery_item_likers(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.certificate_likers(_cert uuid)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, liked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cl.user_id, p.full_name, p.avatar_url, cl.created_at
    FROM public.certificate_likes cl
    LEFT JOIN public.profiles p ON p.id = cl.user_id
   WHERE cl.certificate_id = _cert
     AND public.has_role(auth.uid(), 'superadmin'::app_role)
   ORDER BY cl.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.certificate_likers(uuid) TO authenticated;

DROP POLICY IF EXISTS "Likes public read" ON public.gallery_likes;
CREATE POLICY "Likes read own or super" ON public.gallery_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Cert likes read" ON public.certificate_likes;
CREATE POLICY "Cert likes read own or super" ON public.certificate_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'::app_role));
