// ─────────────────────────────────────────────────────────────────────────────
// Reactions types
// ─────────────────────────────────────────────────────────────────────────────

import {REACTION_EMOJIS} from "./constants";

/** Fixed set of supported reaction emojis. */
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

/**
 * Domain object — used in React state and component props.
 *
 * Converted from `ReactionPayload` in exactly one place (`use-reactions.ts`)
 * after the payload has been validated. `createdAt` is a `Date` here because
 * domain consumers may need to format or compare it.
 */
export type Reaction = {
    id:        string
    lobbyId:   string
    playerId:  string
    emoji:     ReactionEmoji
    createdAt: Date
}