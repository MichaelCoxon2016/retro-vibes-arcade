-- Create a debug function to check auth context
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.uid() as user_id,
    auth.role() as role,
    auth.email() as email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test it
SELECT * FROM debug_auth_context();

-- Also let's create a version of join_game_room that uses the session token
-- This is a temporary debug version
CREATE OR REPLACE FUNCTION join_game_room_debug(p_room_code VARCHAR(6), p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  success BOOLEAN,
  room_id UUID,
  message TEXT,
  debug_info TEXT
) AS $$
DECLARE
  v_room RECORD;
  v_room_id UUID;
  v_user_id UUID;
  v_auth_uid UUID;
BEGIN
  -- Get auth user ID for debugging
  v_auth_uid := auth.uid();
  
  -- Use provided user_id or fall back to auth.uid()
  v_user_id := COALESCE(p_user_id, v_auth_uid);
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'User not authenticated', 
      format('auth.uid(): %s, provided: %s', v_auth_uid, p_user_id);
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
      RETURN QUERY SELECT false, NULL::UUID, format('Room is not available (status: %s)', v_room.status),
        format('auth.uid(): %s', v_auth_uid);
    ELSE
      RETURN QUERY SELECT false, NULL::UUID, 'Room not found',
        format('auth.uid(): %s', v_auth_uid);
    END IF;
    RETURN;
  END IF;
  
  -- Check if user is already in the room
  IF v_room.host_id = v_user_id THEN
    RETURN QUERY SELECT true, v_room.id, 'You are the host of this room',
      format('auth.uid(): %s', v_auth_uid);
    RETURN;
  END IF;
  
  IF v_room.guest_id = v_user_id THEN
    RETURN QUERY SELECT true, v_room.id, 'You are already in this room',
      format('auth.uid(): %s', v_auth_uid);
    RETURN;
  END IF;
  
  IF v_room.guest_id IS NOT NULL THEN
    RETURN QUERY SELECT false, v_room.id, 'Room is already full',
      format('auth.uid(): %s', v_auth_uid);
    RETURN;
  END IF;
  
  -- Join the room
  UPDATE public.game_rooms
  SET guest_id = v_user_id
  WHERE id = v_room.id
  RETURNING id INTO v_room_id;
  
  RETURN QUERY SELECT true, v_room_id, 'Successfully joined the room',
    format('auth.uid(): %s, used: %s', v_auth_uid, v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;