import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  NUM_PLAYERS,
  TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS,
} from "../../../lib/constants";
import { GameStates } from "../../../lib/states";
import { supabaseServer } from "../../../lib/supabaseServer";

async function getActiveGame(user_id: string) {
  return await supabaseServer
    .rpc("find_or_create_active_game", {
      p_user: user_id,
      p_num_players: NUM_PLAYERS,
    })
    .select("*")
    .single();
}

const listOfQuestions = [
  "What is your favorite color?",
  "What is your favorite food?",
  "What is your favorite animal?",
  "What is your favorite movie?",
  "What is your favorite song?",
];

async function getQuestions(gameId: string) {
  return await supabaseServer
    .from("questions")
    .select("*")
    .filter("game", "eq", gameId)
    .order("created_at", { ascending: true });
}

async function getAnswers(question_id: number) {
  return supabaseServer
    .from("answers_with_player_games")
    .select("*")
    .filter("question", "eq", question_id);
}

async function getBotNumber(gameId: string) {
  return await supabaseServer
    .from("games")
    .select("random_bot_number")
    .filter("id", "eq", gameId)
    .single();
}

async function getPlayers(gameId: string) {
  const playerGames = await supabaseServer
    .from("player_games")
    .select("random_player_number")
    .filter("game", "eq", gameId);
  const botId = await getBotNumber(gameId);

  const randomPlayerNumbers = playerGames
    .data!.concat([
      {
        random_player_number: botId.data!.random_bot_number ?? "HELLO",
      },
    ])
    .map((player) => player.random_player_number);
  const sortedPlayerNumbers = randomPlayerNumbers.sort();
  return sortedPlayerNumbers.map((player, index) => ({
    player,
    index,
  }));
}

async function currentPlayerRandomId(gameId: string, userId: string) {
  return await supabaseServer
    .from("player_games")
    .select("random_player_number")
    .filter("game", "eq", gameId)
    .filter("player", "eq", userId)
    .single();
}

export type Questions = (NonNullable<
  UnwrapPromise<ReturnType<typeof getQuestions>>["data"]
>[number] & {
  answers: NonNullable<UnwrapPromise<ReturnType<typeof getAnswers>>["data"]>;
})[];

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ActiveGameType = ReturnType<typeof getActiveGame>;
type Players = UnwrapPromise<ReturnType<typeof getPlayers>>;
type CurrentPlayerRandomId = UnwrapPromise<
  ReturnType<typeof currentPlayerRandomId>
>;

export type GameResponse =
  | (UnwrapPromise<ActiveGameType>["data"] & {
      questions: Questions;
      players: Players;
      me: CurrentPlayerRandomId;
    })
  | undefined;

async function findingPlayersHandler(
  game: NonNullable<UnwrapPromise<ActiveGameType>["data"]>,
  userId: string
): Promise<NonNullable<GameResponse>> {
  return {
    ...game,
    questions: [],
    players: await getPlayers(game.game_id),
    me: await currentPlayerRandomId(game.game_id, userId),
  };
}

async function needsQuestionHandler(
  game: NonNullable<UnwrapPromise<ActiveGameType>["data"]>,
  userId: string
): Promise<NonNullable<GameResponse>> {
  const randomQuestion =
    listOfQuestions[Math.floor(Math.random() * listOfQuestions.length)];
  await supabaseServer.rpc("add_question_to_game", {
    p_game_id: game.game_id,
    p_question_text: randomQuestion,
  });
  return {
    ...game,
    questions: [],
    players: await getPlayers(game.game_id),
    me: await currentPlayerRandomId(game.game_id, userId),
  };
}

async function questionsHandler(
  game: NonNullable<UnwrapPromise<ActiveGameType>["data"]>,
  userId: string
): Promise<NonNullable<GameResponse>> {
  const { data: questions } = await getQuestions(game.game_id);
  if (!questions || questions.length === 0) {
    throw new Error("no questions");
  }

  const currentQuestion = questions[questions.length - 1];
  const timeElapsed =
    Date.now() - new Date(currentQuestion.created_at!).getTime();

  const timeRemaining =
    TOTAL_TIME_TO_ANSWER_QUESTION_SECONDS * 1000 - timeElapsed;
  console.log("timeRemaining", timeRemaining);

  if (timeRemaining < 0) {
    console.log("time is up");
    await supabaseServer
      .from("games")
      .update({ status: "voting" })
      .filter("id", "eq", game.game_id)
      .filter("status", "eq", "questions");
  }

  return {
    ...game,
    questions:
      (await getQuestions(game.game_id)).data?.map((q) => ({
        ...q,
        answers: [],
      })) ?? [],
    players: await getPlayers(game.game_id),
    me: await currentPlayerRandomId(game.game_id, userId),
  };
}

async function getObfuscatedQuestions(gameId: string) {
  const botId = await getBotNumber(gameId);
  return await Promise.all(
    (
      await getQuestions(gameId)
    ).data?.map(async (q) => ({
      ...q,
      answers:
        (
          await getAnswers(q.id)
        ).data?.map((a) => ({
          ...a,
          player: a.is_bot_answer
            ? botId.data!.random_bot_number
            : a.random_player_number,
          is_bot_answer: false,
        })) ?? [],
    })) ?? []
  );
}

async function votingHandler(
  game: NonNullable<UnwrapPromise<ActiveGameType>["data"]>,
  userId: string
): Promise<NonNullable<GameResponse>> {
  return {
    ...game,
    questions: await getObfuscatedQuestions(game.game_id),
    players: await getPlayers(game.game_id),
    me: await currentPlayerRandomId(game.game_id, userId),
  };
}

async function votingResultsHandler(
  game: NonNullable<UnwrapPromise<ActiveGameType>["data"]>,
  userId: string
): Promise<NonNullable<GameResponse>> {
  return {
    ...game,
    questions: await getObfuscatedQuestions(game.game_id),
    players: await getPlayers(game.game_id),
    me: await currentPlayerRandomId(game.game_id, userId),
  };
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameResponse>
) {
  console.log("fetching game");
  const supabase = createServerSupabaseClient({ req, res });
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  if (userId === undefined || !userId) {
    res.status(401).json(undefined);
    return;
  }

  const { data: game, error } = await getActiveGame(userId);

  if (error !== null) {
    res.status(404).json(undefined);
    return;
  }

  const gameStatus: GameStates = game.game_state as GameStates;
  console.log("gameStatus", gameStatus);

  const gameStatusHandlers: Record<
    GameStates,
    (
      x: NonNullable<typeof game>,
      userId: string
    ) => Promise<NonNullable<GameResponse>>
  > = {
    finding_players: findingPlayersHandler,
    needs_question: needsQuestionHandler,
    questions: questionsHandler,
    voting: votingHandler,
    voting_results: votingResultsHandler,
    game_over: async () => {
      throw new Error("game is over");
    },
    should_continue: async () => {
      throw new Error("game should continue");
    },
  };

  try {
    const gameResponse = await gameStatusHandlers[gameStatus](game, userId);
    res.status(200).json(gameResponse);
  } catch (e) {
    console.error(e);
    res.status(500).json(undefined);
  }
}
