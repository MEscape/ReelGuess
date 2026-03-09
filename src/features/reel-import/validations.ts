import { z } from 'zod'

export const ImportReelsSchema = z.object({
  lobbyId: z.string().length(6),
  playerId: z.string().uuid(),
  reelUrls: z
    .array(z.string().url())
    .min(3, 'Import at least 3 reels')
    .max(200, 'Maximum 200 reels'),
})

export type ImportReelsInput = z.infer<typeof ImportReelsSchema>
