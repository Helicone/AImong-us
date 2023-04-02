-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

CREATE OR REPLACE FUNCTION public.add_question_to_game(
	p_game_id uuid,
	p_question_text text)
    RETURNS questions
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    game_record public.games%rowtype;
    question_record public.questions%rowtype;
BEGIN
    -- Check if the game is in the 'needs_question' state
    SELECT * INTO game_record
    FROM public.games
    WHERE id = p_game_id AND status = 'needs_question';

    IF game_record.id IS NULL THEN
        RAISE EXCEPTION 'Game is not in the "needs_question" state.'
        USING HINT = 'Ensure the game is in the "needs_question" state before adding a question.';
    END IF;

    -- Add the question to the game
    INSERT INTO public.questions (game, question)
    VALUES (p_game_id, p_question_text)
    RETURNING * INTO question_record;

    -- Update the game state to 'question'
    UPDATE public.games
    SET status = 'questions'
    WHERE id = p_game_id;

    RETURN question_record;
END;
$BODY$;

ALTER FUNCTION public.add_question_to_game(uuid, text)
    OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.add_question_to_game(uuid, text) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public.add_question_to_game(uuid, text) TO anon;

GRANT EXECUTE ON FUNCTION public.add_question_to_game(uuid, text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.add_question_to_game(uuid, text) TO postgres;

GRANT EXECUTE ON FUNCTION public.add_question_to_game(uuid, text) TO service_role;

