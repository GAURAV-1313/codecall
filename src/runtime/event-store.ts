import { appendFileSync, existsSync, readFileSync } from "node:fs";
import type { LearnEvent } from "../schemas/types.js";

export interface EventStore {
  append(event: LearnEvent): void;
  read(sessionId: string): LearnEvent[];
}

export class MemoryEventStore implements EventStore {
  private readonly events: LearnEvent[] = [];

  append(event: LearnEvent): void {
    this.events.push(structuredClone(event));
  }

  read(sessionId: string): LearnEvent[] {
    return this.events.filter((event) => event.sessionId === sessionId).map((event) => structuredClone(event));
  }
}

/**
 * A deliberately small caller-owned persistence option. The runtime never
 * chooses a storage location or sends events elsewhere; the adapter supplies it.
 */
export class JsonlEventStore implements EventStore {
  constructor(private readonly filePath: string) {}

  append(event: LearnEvent): void {
    appendFileSync(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
  }

  read(sessionId: string): LearnEvent[] {
    if (!existsSync(this.filePath)) return [];
    return readFileSync(this.filePath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as LearnEvent)
      .filter((event) => event.sessionId === sessionId);
  }
}
