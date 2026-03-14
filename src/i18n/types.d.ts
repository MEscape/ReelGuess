// ─────────────────────────────────────────────────────────────────────────────
// next-intl type augmentation
//
// Makes useTranslations, getTranslations, etc. fully type-safe
// based on the actual translation keys in messages/en.json.
// ─────────────────────────────────────────────────────────────────────────────

import type messages from '../messages/en.json'

type Messages = typeof messages

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntlMessages extends Messages {}
}

