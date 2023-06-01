// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { Answer } from "./Answer";
import type { SessionId } from "./SessionId";
import type { VoteResult } from "./VoteResult";

export type ClientGameState = { state: "Lobby" } | { state: "Answering", content: { started_at: bigint, question: string, you_answered: boolean, allowed_time: number, } } | { state: "Voting", content: { started_at: bigint, question: string, answers: Record<SessionId, Answer>, allowed_time: number, you_voted: boolean, } } | { state: "Reviewing", content: { is_game_over: boolean, started_at: bigint, question: string, results: Array<VoteResult>, number_of_players_ready: number, bot_ids: Array<SessionId>, } };