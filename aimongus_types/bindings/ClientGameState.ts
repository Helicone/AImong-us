// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { Answer } from "./Answer";

export type ClientGameState = { state: "Lobby", content: { is_host: boolean, } } | { state: "Answering", content: { started_at: bigint, question: string, you_voted: boolean, } } | { state: "Voting", content: { started_at: bigint, question: string, answers: Array<Answer>, votes: Array<number | null>, } } | { state: "Reviewing", content: { started_at: bigint, question: string, answers: Array<Answer>, votes: Array<number | null>, eliminated: [number, boolean] | null, number_of_players_ready: number, } };