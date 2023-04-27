import { shuffle } from "../lib/shuffle";

export const AVATARS = [
  { emoji: "🐲", name: "Dragon", color: "bg-red-400" },
  { emoji: "🐻", name: "Bear", color: "bg-orange-400" },
  { emoji: "🐙", name: "Octopus", color: "bg-amber-400" },
  { emoji: "🐸", name: "Frog", color: "bg-yellow-400" },
  { emoji: "🐨", name: "Koala", color: "bg-lime-400" },
  { emoji: "🐰", name: "Rabbit", color: "bg-green-400" },
  { emoji: "🐶", name: "Dog", background: "bg-emerald-400" },
  { emoji: "🐮", name: "Cow", color: "bg-teal-400" },
  { emoji: "🦊", name: "Fox", color: "bg-cyan-400" },
  { emoji: "🐭", name: "Mouse", color: "bg-sky-400" },
  { emoji: "🐻‍❄️", name: "Polar Bear", color: "bg-blue-400" },
  { emoji: "🐷", name: "Pig", color: "bg-indigo-400" },
  { emoji: "🐼", name: "Panda", color: "bg-purple-400" },
  { emoji: "🐵", name: "Monkey", background: "bg-fuchsia-400" },
  { emoji: "🐯", name: "Tiger", color: "bg-pink-400" },
  { emoji: "🦁", name: "Lion", color: "bg-rose-400" },
];

export function getAvatar(playerIdx: number, seed: string) {
  const seedNumber = seed
    .split("")
    .map((char) => char.charCodeAt(0))
    .reduce((a, b) => a + b, 0);

  return shuffle(AVATARS, seedNumber)[playerIdx];
}
