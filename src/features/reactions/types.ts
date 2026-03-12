// ─────────────────────────────────────────────────────────────────────────────
// Reactions types
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed set of supported reaction emojis. */
export const REACTION_EMOJIS = ['😂', '🤯', '🔥', '👏', '🧠'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

/** A reaction event — camelCase representation of the `reactions` DB row. */
export type Reaction = {
    id:        string
    lobbyId:   string
    playerId:  string
    emoji:     ReactionEmoji
    createdAt: Date
}

/** @internal Raw DB row from the `reactions` table. */
export type ReactionRow = {
    id:         string
    lobby_id:   string
    player_id:  string
    emoji:      string
    created_at: string
}

/** Converts a raw `reactions` DB row to the typed {@link Reaction} shape. */
export function mapReactionRow(row: ReactionRow): Reaction {
    return {
        id:        row.id,
        lobbyId:   row.lobby_id,
        playerId:  row.player_id,
        emoji:     row.emoji as ReactionEmoji,
        createdAt: new Date(row.created_at),
    }
}
