import { buildSeedState } from "@/lib/mock-data";
import type { AdminState } from "@/types/state";

/**
 * Reads the fictional administration seed.
 * Replace this function with a NestJS client when the API exists.
 * It does not call a network service, authenticate a user, or run a model.
 */
export function readSeedState(): AdminState {
  return structuredClone(buildSeedState());
}
