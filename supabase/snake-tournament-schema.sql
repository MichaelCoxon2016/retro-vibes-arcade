-- Tournaments (create this first since snake_sessions references it)
CREATE TABLE public.tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  max_players INTEGER DEFAULT 6,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  rules JSONB NOT NULL DEFAULT '{"boardSize": "massive", "timeLimit": 120, "powerUpsEnabled": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Snake game sessions
CREATE TABLE public.snake_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'pvp', 'tournament')),
  players JSONB NOT NULL,
  state JSONB NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES public.users(id),
  tournament_id UUID REFERENCES public.tournaments(id)
);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  placement INTEGER,
  total_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'eliminated', 'winner')),
  UNIQUE(tournament_id, user_id)
);

-- Admin users (only these emails can create tournaments)
CREATE TABLE public.admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Power-up definitions
CREATE TABLE public.powerups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  duration INTEGER, -- in seconds
  effect JSONB NOT NULL,
  tournament_only BOOLEAN DEFAULT false,
  icon TEXT,
  color TEXT
);

-- Insert default power-ups
INSERT INTO public.powerups (name, type, duration, effect, tournament_only, icon, color) VALUES
  ('Speed Boost', 'speed', 5, '{"multiplier": 2}', false, '⚡', '#FFFF00'),
  ('Slow Motion', 'slow_others', 5, '{"multiplier": 0.5}', false, '🐌', '#00FFFF'),
  ('Ghost Mode', 'ghost', 5, '{"passThrough": true}', false, '👻', '#9D00FF'),
  ('Double Points', 'score', 10, '{"multiplier": 2}', false, '💎', '#FF00FF'),
  ('Shield', 'shield', 0, '{"protection": 1}', false, '🛡️', '#00FF00'),
  ('Mega Growth', 'growth', 0, '{"segments": 5}', true, '🔥', '#FF6600'),
  ('Freeze', 'freeze_others', 2, '{"frozen": true}', true, '❄️', '#00D9FF'),
  ('Teleport', 'teleport', 0, '{"random": true}', true, '🌀', '#FF10F0'),
  ('Shrink Ray', 'shrink_others', 5, '{"segments": -3}', true, '🔫', '#FF0000');

-- Create indexes
CREATE INDEX idx_snake_sessions_tournament ON public.snake_sessions(tournament_id);
CREATE INDEX idx_snake_sessions_mode ON public.snake_sessions(mode);
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON public.tournament_participants(user_id);
CREATE INDEX idx_tournaments_code ON public.tournaments(code);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);

-- Enable RLS
ALTER TABLE public.snake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.powerups ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Snake sessions: Users can view their own sessions
CREATE POLICY "Users can view their own snake sessions" ON public.snake_sessions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT jsonb_array_elements_text(players->'playerIds')::uuid
    )
  );

-- Snake sessions: Anyone can insert (for starting games)
CREATE POLICY "Users can create snake sessions" ON public.snake_sessions
  FOR INSERT WITH CHECK (true);

-- Tournaments: Anyone can view active tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

-- Tournaments: Only admins can create/update tournaments
CREATE POLICY "Only admins can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (
    auth.jwt()->>'email' IN (SELECT email FROM public.admin_users)
  );

CREATE POLICY "Only admins can update tournaments" ON public.tournaments
  FOR UPDATE USING (
    auth.jwt()->>'email' IN (SELECT email FROM public.admin_users)
  );

-- Tournament participants: Anyone can view participants
CREATE POLICY "Anyone can view tournament participants" ON public.tournament_participants
  FOR SELECT USING (true);

-- Tournament participants: Users can join tournaments
CREATE POLICY "Users can join tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tournament participants: Users can update their own status
CREATE POLICY "Users can update their tournament status" ON public.tournament_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin users: Only admins can view admin list
CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT USING (
    auth.jwt()->>'email' IN (SELECT email FROM public.admin_users)
  );

-- Power-ups: Everyone can view power-ups
CREATE POLICY "Anyone can view powerups" ON public.powerups
  FOR SELECT USING (true);

-- Function to generate unique tournament code
CREATE OR REPLACE FUNCTION generate_tournament_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tournament code
CREATE OR REPLACE FUNCTION set_tournament_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_tournament_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tournament_code_trigger
  BEFORE INSERT ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION set_tournament_code();

-- Add yourself as admin (replace with your email)
-- INSERT INTO public.admin_users (email) VALUES ('your-email@example.com');