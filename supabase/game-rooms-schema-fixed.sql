-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.game_events CASCADE;
DROP TABLE IF EXISTS public.game_states CASCADE;
DROP TABLE IF EXISTS public.game_rooms CASCADE;

-- Game rooms table for multiplayer games
CREATE TABLE public.game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_type VARCHAR(50) NOT NULL DEFAULT 'snake',
  game_mode VARCHAR(20) NOT NULL DEFAULT 'pvp',
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  settings JSONB DEFAULT '{}',
  host_ready BOOLEAN DEFAULT false,
  guest_ready BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'ready', 'playing', 'finished', 'cancelled'))
);

-- Real-time game states for synchronization
CREATE TABLE public.game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(room_id, player_id, sequence_number)
);

-- Game events for important game moments
CREATE TABLE public.game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_rooms_room_code ON public.game_rooms(room_code);
CREATE INDEX idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX idx_game_rooms_created_at ON public.game_rooms(created_at DESC);
CREATE INDEX idx_game_states_room_player ON public.game_states(room_id, player_id);
CREATE INDEX idx_game_states_sequence ON public.game_states(room_id, sequence_number DESC);
CREATE INDEX idx_game_events_room_id ON public.game_events(room_id);
CREATE INDEX idx_game_events_created_at ON public.game_events(room_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- Game rooms policies
CREATE POLICY "Anyone can view active game rooms" 
ON public.game_rooms FOR SELECT 
USING (status IN ('waiting', 'ready', 'playing'));

CREATE POLICY "Authenticated users can create game rooms" 
ON public.game_rooms FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Room participants can update game rooms" 
ON public.game_rooms FOR UPDATE 
USING (auth.uid() IN (host_id, guest_id));

CREATE POLICY "Host can delete their game rooms" 
ON public.game_rooms FOR DELETE 
USING (auth.uid() = host_id);

-- Game states policies
CREATE POLICY "Room participants can view game states" 
ON public.game_states FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.game_rooms
    WHERE game_rooms.id = game_states.room_id
    AND auth.uid() IN (game_rooms.host_id, game_rooms.guest_id)
  )
);

CREATE POLICY "Room participants can insert game states" 
ON public.game_states FOR INSERT 
WITH CHECK (
  auth.uid() = player_id AND
  EXISTS (
    SELECT 1 FROM public.game_rooms
    WHERE game_rooms.id = room_id
    AND auth.uid() IN (game_rooms.host_id, game_rooms.guest_id)
    AND game_rooms.status = 'playing'
  )
);

-- Game events policies
CREATE POLICY "Room participants can view game events" 
ON public.game_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.game_rooms
    WHERE game_rooms.id = game_events.room_id
    AND auth.uid() IN (game_rooms.host_id, game_rooms.guest_id)
  )
);

CREATE POLICY "Room participants can create game events" 
ON public.game_events FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.game_rooms
    WHERE game_rooms.id = room_id
    AND auth.uid() IN (game_rooms.host_id, game_rooms.guest_id)
    AND game_rooms.status = 'playing'
  )
);

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new game room
CREATE OR REPLACE FUNCTION create_game_room(
  p_game_type VARCHAR(50) DEFAULT 'snake',
  p_game_mode VARCHAR(20) DEFAULT 'pvp',
  p_settings JSONB DEFAULT '{}'
)
RETURNS TABLE (
  room_id UUID,
  room_code VARCHAR(6)
) AS $$
DECLARE
  v_room_code VARCHAR(6);
  v_room_id UUID;
  v_attempts INTEGER := 0;
BEGIN
  -- Try to generate a unique room code
  LOOP
    v_room_code := generate_room_code();
    v_attempts := v_attempts + 1;
    
    -- Try to insert with this code
    BEGIN
      INSERT INTO public.game_rooms (room_code, host_id, game_type, game_mode, settings)
      VALUES (v_room_code, auth.uid(), p_game_type, p_game_mode, p_settings)
      RETURNING id INTO v_room_id;
      
      -- Success! Return the result
      RETURN QUERY SELECT v_room_id, v_room_code;
      RETURN;
    EXCEPTION
      WHEN unique_violation THEN
        -- Code already exists, try again
        IF v_attempts > 10 THEN
          RAISE EXCEPTION 'Could not generate unique room code after 10 attempts';
        END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a game room
CREATE OR REPLACE FUNCTION join_game_room(p_room_code VARCHAR(6))
RETURNS TABLE (
  success BOOLEAN,
  room_id UUID,
  message TEXT
) AS $$
DECLARE
  v_room RECORD;
  v_room_id UUID;
BEGIN
  -- Find the room
  SELECT * INTO v_room FROM public.game_rooms
  WHERE room_code = p_room_code
  AND status = 'waiting'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Room not found or not available';
    RETURN;
  END IF;
  
  -- Check if user is already in the room
  IF v_room.host_id = auth.uid() THEN
    RETURN QUERY SELECT false, v_room.id, 'You are already the host of this room';
    RETURN;
  END IF;
  
  IF v_room.guest_id IS NOT NULL THEN
    RETURN QUERY SELECT false, v_room.id, 'Room is already full';
    RETURN;
  END IF;
  
  -- Join the room
  UPDATE public.game_rooms
  SET guest_id = auth.uid()
  WHERE id = v_room.id
  RETURNING id INTO v_room_id;
  
  RETURN QUERY SELECT true, v_room_id, 'Successfully joined the room';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rooms
CREATE OR REPLACE FUNCTION cleanup_old_game_rooms()
RETURNS void AS $$
BEGIN
  -- Delete rooms that are older than 1 hour and not in playing status
  DELETE FROM public.game_rooms
  WHERE created_at < NOW() - INTERVAL '1 hour'
  AND status NOT IN ('playing', 'finished');
  
  -- Mark rooms as cancelled if they've been playing for more than 30 minutes
  UPDATE public.game_rooms
  SET status = 'cancelled',
      ended_at = NOW()
  WHERE status = 'playing'
  AND started_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON public.game_rooms TO authenticated;
GRANT ALL ON public.game_states TO authenticated;
GRANT ALL ON public.game_events TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_game_room TO authenticated;
GRANT EXECUTE ON FUNCTION join_game_room TO authenticated;