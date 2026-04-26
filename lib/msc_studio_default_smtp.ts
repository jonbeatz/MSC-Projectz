import type { SpacemailSMTP } from '@/lib/types'

/** Aligned with `defaultAppSettings.smtp` in the client store; used as last-resort fallback on the server. */
export const MSC_STUDIO_DEFAULT_OUTGOING_SMTP: SpacemailSMTP = {
  incomingHost: 'mail.spacemail.com',
  incomingPort: '993',
  outgoingHost: 'mail.spacemail.com',
  outgoingPort: '465',
  username: '',
  password: '',
  ssl: true,
}
