-- First, check the structure of game_rooms table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_rooms' 
ORDER BY ordinal_position;

-- Check recent rooms without updated_at
SELECT id, room_code, status, host_id, guest_id, created_at
FROM game_rooms 
ORDER BY created_at DESC 
LIMIT 10;

-- Fix the join_game_room function to remove updated_at reference
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
  
  -- Join the room (removed updated_at)
  UPDATE public.game_rooms
  SET guest_id = v_user_id
  WHERE id = v_room.id
  RETURNING id INTO v_room_id;
  
  RETURN QUERY SELECT true, v_room_id, 'Successfully joined the room';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;