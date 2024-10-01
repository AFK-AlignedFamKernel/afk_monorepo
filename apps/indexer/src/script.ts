import { Block } from "./deps.ts";

export const config = {
  streamUrl: "https://sepolia.starknet.a5a.ch",
  startingBlock: 10_000,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter: {
    header: {},
  },
  sinkType: "postgres",
  sinkOptions: {},
};

// This transform does nothing.
export default function transform(block: Block) {
  return block;
}
