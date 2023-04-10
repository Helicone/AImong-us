-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

CREATE OR REPLACE FUNCTION public.find_or_create_active_game(
    p_user uuid,
    p_num_players integer,
    p_get_new_game boolean)
    RETURNS TABLE(game_id uuid, player_count integer, game_state text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    active_game_id uuid;
    game_status text;
BEGIN
    -- Check if the user is already in an active game
    SELECT g.id, g.status INTO active_game_id, game_status
    FROM public.games AS g
    JOIN public.player_games AS pg ON g.id = pg.game
    WHERE pg.player = p_user
    ORDER BY g.created_at DESC
    LIMIT 1;
    SELECT COUNT(*) INTO player_count
    FROM public.player_games
    WHERE game = active_game_id;
    -- If the user is not in an active game, find or create one
    IF p_get_new_game AND (game_status = 'game_over' OR active_game_id is NULL) THEN
        -- Try to find a game with status 'finding_players' and less than p_num_players players
        SELECT g.id, g.status, COUNT(pg.player) INTO active_game_id, game_status, player_count
        FROM public.games AS g
        JOIN public.player_games AS pg ON g.id = pg.game
        WHERE g.status = 'finding_players'
        GROUP BY g.id, g.status
        HAVING COUNT(pg.player) < p_num_players
        LIMIT 1;

        -- If no game is found, create a new one with status 'finding_players'
        IF active_game_id IS NULL THEN
            INSERT INTO public.games (status)
            VALUES ('finding_players')
            RETURNING id, status INTO active_game_id, game_status;

            -- Set player_count to 0 for a new game
            player_count := 0;
        END IF;

        -- Add the user to the player_games table
        INSERT INTO public.player_games (game, player)
        VALUES (active_game_id, p_user)
        ON CONFLICT (game, player) DO NOTHING;

        -- Get the updated player count for the game
        SELECT COUNT(*) INTO player_count
        FROM public.player_games
        WHERE game = active_game_id;

        -- Set the game status to 'active' if there are p_num_players players
        IF player_count = p_num_players THEN
            UPDATE public.games
            SET status = 'starting_game'
            WHERE id = active_game_id;

            -- Update the game_status variable
            game_status := 'starting_game';
        END IF;
    END IF;

    -- Return the game_id, player_count, and game_state
    RETURN QUERY SELECT active_game_id, player_count, game_status;
END;
$BODY$;

ALTER FUNCTION public.find_or_create_active_game(uuid, integer, boolean)
    OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.find_or_create_active_game(uuid, integer, boolean) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public.find_or_create_active_game(uuid, integer, boolean) TO anon;

GRANT EXECUTE ON FUNCTION public.find_or_create_active_game(uuid, integer, boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION public.find_or_create_active_game(uuid, integer, boolean) TO postgres;

GRANT EXECUTE ON FUNCTION public.find_or_create_active_game(uuid, integer, boolean) TO service_role;

