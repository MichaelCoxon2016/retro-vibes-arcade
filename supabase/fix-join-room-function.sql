-- Update the join_game_room function to be case-insensitive and provide better error messages
CREATE OR REPLACE FUNCTION join_game_room(p_room_code VARCHAR(6))
RETURNS TABLE (
  success BOOLEAN,
  room_id UUID,
  message TEXT
) AS $$
DECLARE
  v_room RECORD;
  v_room_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'User not authenticated';
    RETURN;
  END IF;

  -- Find the room (case-insensitive)
  SELECT * INTO v_room FROM public.game_rooms
  WHERE UPPER(room_code) = UPPER(p_room_code)
  AND status = 'waiting'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Check if room exists but in different status
    IF EXISTS (SELECT 1 FROM public.game_rooms WHERE UPPER(room_code) = UPPER(p_room_code)) THEN
      SELECT status INTO v_room FROM public.game_rooms WHERE UPPER(room_code) = UPPER(p_room_code);
      RETURN QUERY SELECT false, NULL::UUID, format('Room is not available (status: %s)', v_room.status);
    ELSE
      RETURN QUERY SELECT false, NULL::UUID, 'Room not found';
    END IF;
    RETURN;
  END IF;
  
  -- Check if user is already in the room
  IF v_room.host_id = v_user_id THEN
    RETURN QUERY SELECT true, v_room.id, 'You are the host of this room';
    RETURN;
  END IF;
  
  IF v_room.guest_id = v_user_id THEN
    RETURN QUERY SELECT true, v_room.id, 'You are already in this room';
    RETURN;
  END IF;
  
  IF v_room.guest_id IS NOT NULL THEN
    RETURN QUERY SELECT false, v_room.id, 'Room is already full';
    RETURN;
  END IF;
  
  -- Join the room
  UPDATE public.game_rooms
  SET guest_id = v_user_id,
      updated_at = NOW()
  WHERE id = v_room.id
  RETURNING id INTO v_room_id;
  
  RETURN QUERY SELECT true, v_room_id, 'Successfully joined the room';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update room code generation to always use uppercase
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add an index for case-insensitive room code lookups
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code_upper ON public.game_rooms (UPPER(room_code));