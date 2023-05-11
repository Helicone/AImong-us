// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { SessionId } from "./SessionId";

export type ClientResponse = "StartGame" | { SubmitAnswer: string } | { SubmitVote: { answer_id: SessionId, } } | "ReadyForNextTurn" | { SendChat: string } | { SetQuestions: Array<string> };