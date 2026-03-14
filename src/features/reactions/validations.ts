import z from "zod";
import { REACTION_EMOJIS } from "./constants";

/**
 * Runtime validation for incoming Supabase broadcast payloads.
 *
 * Replaces four consecutive `as` casts that passed unvalidated network data
 * directly into React state. If any field is missing, wrong type, or contains
 * an unknown emoji, the parse throws a ZodError that is caught and the
 * reaction is silently dropped — the UI never receives malformed data.
 *
 * `z.enum(REACTION_EMOJIS)` validates that the emoji is a known member of
 * the fixed set, preventing arbitrary strings from reaching the DOM.
 */
export const ReactionPayloadSchema = z.object({
    id:        z.string().uuid(),
    lobbyId:  z
        .string()
        .length(6)
        .toUpperCase()
        .regex(/^[A-Z0-9]{6}$/, 'Invalid lobby code format'),
    playerId:  z.string().uuid(),
    emoji:     z.enum(REACTION_EMOJIS),
    createdAt: z.string().datetime({ offset: true }),
})
