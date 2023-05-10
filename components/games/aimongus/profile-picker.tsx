import EmojiPicker from "emoji-picker-react";

import { useState } from "react";
import { CgDice5 } from "react-icons/cg";
import { PLAYER_NAMES } from "../../../lib/constants";
import { EMOJIS } from "../../../lib/emojis";
import { Col } from "../../layout/col";
import { Row } from "../../layout/row";
import { Modal } from "../../modal";
import { TinyLabel } from "../../tinylabel";

export function ProfilePicker(props: {
  selectedEmoji: string | null;
  setSelectedEmoji: (t: string | null) => void;
  username: string;
  setUsername: (t: string) => void;
}) {
  const { selectedEmoji, setSelectedEmoji, username, setUsername } = props;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  return (
    <>
      <Modal open={showEmojiPicker} setOpen={setShowEmojiPicker}>
        <EmojiPicker
          onEmojiClick={(e, emojiObject) => {
            setSelectedEmoji(e.emoji);
            setShowEmojiPicker(false);
          }}
        />
      </Modal>
      <Row>
        <Col className="mx-auto gap-1">
          <button
            className="text-6xl w-20 h-20 mx-auto rounded-full bg-gradient-to-bl bg-gradient from-slate-600 to-slate-400 border-2 border-slate-400 hover:border-pink-500 transition-all"
            onClick={() => setShowEmojiPicker(true)}
          >
            {selectedEmoji}
          </button>
          <TinyLabel text={"Profile"} />
        </Col>
      </Row>
      <Col className="w-full relative gap-1 text-left">
        <input
          type="text"
          placeholder="Username"
          className="border-2 border-transparent bg-violet-900 w-full rounded-md focus:outline-none focus:border-pink-500 px-4 py-2"
          value={username}
          onChange={(e) =>
            e.target.value.length < 10 && setUsername(e.target.value)
          }
        />
        <TinyLabel text={"Username"} />
        <button
          className="absolute right-2 top-2.5 opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => {
            setSelectedEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
            setUsername(
              PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]
            );
          }}
        >
          <CgDice5 className="h-6 w-6" />
        </button>
      </Col>
    </>
  );
}
