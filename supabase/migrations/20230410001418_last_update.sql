drop function if exists "public"."submit_answer"(p_user_id uuid, p_question_id bigint, p_answer_text text);

alter table "public"."games" add column "last_updated" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.find_or_create_active_game(p_user uuid, p_num_players integer)
 RETURNS TABLE(game_id uuid, player_count integer, game_state text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    active_game_id uuid;
    game_status text;
BEGIN
    -- Check if the user is already in an active game
    SELECT g.id, g.status INTO active_game_id, game_status
    FROM public.games AS g
    JOIN public.player_games AS pg ON g.id = pg.game
    WHERE g.status IN ('game_over', 'finding_players', 'starting_game', 'needs_question', 'questions', 'voting', 'voting_results', 'should_continue') AND pg.player = p_user;

    -- If the user is not in an active game, find or create one
    IF active_game_id IS NULL THEN
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
    ELSE
        -- Get the player count for the active game the user is in
        SELECT COUNT(*) INTO player_count
        FROM public.player_games
        WHERE game = active_game_id;
    END IF;

    -- Return the game_id, player_count, and game_state
    RETURN QUERY SELECT active_game_id, player_count, game_status;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_answer(p_user_id uuid, p_question_id bigint, p_answer_text text, p_allowed_response_time integer)
 RETURNS answers
 LANGUAGE plpgsql
AS $function$
DECLARE
    game_id uuid;
    answer_record public.answers%rowtype;
    answer_exists boolean;
    question_created_at timestamp with time zone;
    response_time_exceeded boolean;
    all_answers_submitted boolean;
BEGIN
    -- Check if the user is in the game
    SELECT q.game, q.created_at INTO game_id, question_created_at
    FROM public.questions AS q
    JOIN public.player_games AS pg ON q.game = pg.game
    WHERE q.id = p_question_id AND pg.player = p_user_id;

    IF game_id IS NULL THEN
        RAISE EXCEPTION 'User is not in the game for the given question.'
        USING HINT = 'Ensure the user is in the game before submitting an answer.';
    END IF;

    -- Check if the response time is exceeded
    SELECT now() > (question_created_at + (p_allowed_response_time || ' seconds')::interval) INTO response_time_exceeded;

    IF response_time_exceeded THEN
        RAISE EXCEPTION 'The allowed response time has been exceeded for this question.'
        USING HINT = 'Ensure the answer is submitted within the allowed response time.';
    END IF;

    -- Check if the user has already submitted an answer for the question
    SELECT EXISTS (
        SELECT 1
        FROM public.answers
        WHERE question = p_question_id AND player = p_user_id
    ) INTO answer_exists;

    IF answer_exists THEN
        RAISE EXCEPTION 'User has already submitted an answer for this question.'
        USING HINT = 'Ensure the user has not submitted an answer before calling this function.';
    ELSE
        -- Submit the answer
        INSERT INTO public.answers (question, answer, player, is_bot_answer)
        VALUES (p_question_id, p_answer_text, p_user_id, false)
        RETURNING * INTO answer_record;

        -- Check if all players in the game have submitted answers
        SELECT NOT EXISTS (
            SELECT 1
            FROM public.player_games AS pg
            LEFT JOIN public.answers AS a ON a.player = pg.player AND a.question = p_question_id
            WHERE pg.game = game_id AND pg.is_voted_out = false AND a.id IS NULL
        ) INTO all_answers_submitted;

        IF all_answers_submitted THEN
            UPDATE public.games
            SET status = 'voting'
            WHERE id = game_id;
        END IF;

        RETURN answer_record;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_answer(p_user_id uuid, p_question_id bigint, p_answer_text text)
 RETURNS answers
 LANGUAGE plpgsql
AS $function$
DECLARE
    game_id uuid;
    answer_record public.answers%rowtype;
    answer_exists boolean;
    question_created_at timestamp with time zone;
    all_answers_submitted boolean;
BEGIN
    -- Check if the user is in the game
    SELECT q.game, q.created_at INTO game_id, question_created_at
    FROM public.questions AS q
    JOIN public.player_games AS pg ON q.game = pg.game
    WHERE q.id = p_question_id AND pg.player = p_user_id;

    IF game_id IS NULL THEN
        RAISE EXCEPTION 'User is not in the game for the given question.'
        USING HINT = 'Ensure the user is in the game before submitting an answer.';
    END IF;

    -- Check if the user has already submitted an answer for the question
    SELECT EXISTS (
        SELECT 1
        FROM public.answers
        WHERE question = p_question_id AND player = p_user_id
    ) INTO answer_exists;

    IF answer_exists THEN
        RAISE EXCEPTION 'User has already submitted an answer for this question.'
        USING HINT = 'Ensure the user has not submitted an answer before calling this function.';
    ELSE
        -- Submit the answer
        INSERT INTO public.answers (question, answer, player, is_bot_answer)
        VALUES (p_question_id, p_answer_text, p_user_id, false)
        RETURNING * INTO answer_record;

        -- Check if all players in the game have submitted answers
        SELECT NOT EXISTS (
            SELECT 1
            FROM public.player_games AS pg
            LEFT JOIN public.answers AS a ON a.player = pg.player AND a.question = p_question_id
            WHERE pg.game = game_id AND pg.is_voted_out = false AND a.id IS NULL
        ) INTO all_answers_submitted;

        IF all_answers_submitted THEN
            UPDATE public.games
            SET status = 'voting'
            WHERE id = game_id;
        END IF;

        RETURN answer_record;
    END IF;
END;
$function$
;


drop function if exists "storage"."can_insert_object"(bucketid text, name text, owner uuid, metadata jsonb);

alter table "storage"."objects" drop column "version";


