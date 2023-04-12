import { ClientGameState } from "./ClientGameState";
import { ClientResponse } from "./ClientResponse";

export type ExtractClientGameState<T extends ClientGameState["state"]> =
  Extract<ClientGameState, { state: T }>;

export interface MyClientGameStateView<T extends ClientGameState["state"]> {
  number_of_players: number;
  game_state: ExtractClientGameState<T>;
}
