import { ClientGameState } from "./ClientGameState";
import { ClientGameStateView } from "./ClientGameStateView";

export type ExtractClientGameState<T extends ClientGameState["state"]> =
  Extract<ClientGameState, { state: T }>;

export interface MyClientGameStateView<T extends ClientGameState["state"]>
  extends ClientGameStateView {
  game_state: ExtractClientGameState<T>;
}
