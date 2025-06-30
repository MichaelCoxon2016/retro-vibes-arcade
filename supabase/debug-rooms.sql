-- Debug script to check game rooms state

-- Check if there are any rooms
SELECT id, room_code, host_id, guest_id, status, created_at 
FROM public.game_rooms 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_game_room', 'join_game_room', 'generate_room_code');

-- Test the join_game_room function with a dummy code
-- This will show what error message is returned
SELECT * FROM join_game_room('AAAAAA');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'game_rooms';

-- Check if auth.uid() returns a value (run this as an authenticated user)
SELECT auth.uid();