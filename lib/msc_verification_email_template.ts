/**
 * Shared verification / invite email body (HTML + plain text).
 * Safe to import from client (Dev Playground preview) — no Node-only APIs.
 *
 * Visual language: Command Center dark neutrals + restrained **accent** CTA (`#599ede`, `msc-ui-accent`)
 * per `.cursor/skills/MSC-Skillz/Jedi-Dashboard-Magic/SKILL.md` — calm card, subtle border, no neon clash.
 * Typography: system sans stack (email clients often ignore `ui-sans-serif`; `<style>` resets default link blue).
 */

export const MSC_VERIFICATION_EMAIL_TTL_HOURS = 24

/** Dark studio — neutral layers + single accent for primary action */
const MSC_EMAIL_PAGE_BG = '#0a0a0a'
const MSC_EMAIL_CARD_BG = '#18181b'
const MSC_EMAIL_CARD_BORDER = 'rgba(255,255,255,0.08)'
const MSC_EMAIL_FOREGROUND = '#fafafa'
const MSC_EMAIL_BODY = '#a1a1aa'
const MSC_EMAIL_DIM = '#71717a'
const MSC_EMAIL_ACCENT = '#599ede'
const MSC_EMAIL_ACCENT_TEXT = '#fafafa'
const MSC_EMAIL_INSET = '#27272a'

/** System-first sans stack (avoid `ui-sans-serif` — many clients fall back to serif). */
const MSC_EMAIL_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Helvetica,Arial,sans-serif'

function msc_escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export type MscVerificationEmailMode = 'signup' | 'invite'

export type MscBuildVerificationEmailInput = {
  recipientName?: string | null
  recipientEmail: string
  verifyUrl: string
  signInOrigin: string
  mode: MscVerificationEmailMode
  inviteTemporaryPassword?: string | null
  ttlHours?: number
}

export function msc_buildVerificationEmailParts(input: MscBuildVerificationEmailInput): {
  subject: string
  text: string
  html: string
} {
  const ttl = input.ttlHours ?? MSC_VERIFICATION_EMAIL_TTL_HOURS
  const name = input.recipientName?.trim()
  const greetingText = name ? `Hello ${name},` : 'Hello,'
  const greetingHtml = name ? `Hello ${msc_escHtml(name)},` : 'Hello,'
  const invitePw = input.inviteTemporaryPassword?.trim()
  const isInvite = input.mode === 'invite' && invitePw != null && invitePw.length > 0

  const subject = isInvite ? 'Your MSC-Projectz invitation' : 'Verify your MSC-Projectz account'

  const inviteTextBlock = isInvite
    ? `\n\nYou were invited to MSC-Projectz. After you verify your email, sign in at:\n  ${input.signInOrigin}/auth\n\nUse this email address and temporary password (change it under Profile after signing in):\n  Email: ${input.recipientEmail}\n  Temporary password: ${invitePw}\n`
    : ''

  const text =
    `${greetingText}\n\n` +
    `Please verify your email address to activate your account.\n\n` +
    `${input.verifyUrl}\n\n` +
    `This link expires in ${ttl} hours.` +
    inviteTextBlock

  const inviteHtmlBlock = isInvite
    ? `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;">
  <tr>
    <td style="padding:18px 20px;border-radius:12px;border:1px solid ${MSC_EMAIL_CARD_BORDER};background-color:${MSC_EMAIL_CARD_BG};">
      <p style="margin:0 0 10px;font-family:${MSC_EMAIL_FONT};font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MSC_EMAIL_DIM};-webkit-font-smoothing:antialiased;">Invitation</p>
      <p style="margin:0 0 14px;font-family:${MSC_EMAIL_FONT};font-size:14px;line-height:1.65;color:${MSC_EMAIL_BODY};-webkit-font-smoothing:antialiased;">After you verify, sign in at <a href="${msc_escHtml(input.signInOrigin + '/auth')}" class="msc-textlink" style="color:${MSC_EMAIL_ACCENT};font-weight:600;text-decoration:none;">${msc_escHtml(input.signInOrigin)}/auth</a> using:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px 12px;border-radius:8px;background-color:${MSC_EMAIL_INSET};font-family:${MSC_EMAIL_FONT};font-size:12px;color:${MSC_EMAIL_DIM};-webkit-font-smoothing:antialiased;">Email</td>
        </tr>
        <tr><td style="height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:10px 12px;border-radius:8px;background-color:${MSC_EMAIL_INSET};font-family:${MSC_EMAIL_FONT};font-size:14px;font-weight:500;color:${MSC_EMAIL_FOREGROUND};-webkit-font-smoothing:antialiased;">${msc_escHtml(input.recipientEmail)}</td>
        </tr>
        <tr><td style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:10px 12px;border-radius:8px;background-color:${MSC_EMAIL_INSET};font-family:${MSC_EMAIL_FONT};font-size:12px;color:${MSC_EMAIL_DIM};-webkit-font-smoothing:antialiased;">Temporary password</td>
        </tr>
        <tr><td style="height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:10px 12px;border-radius:8px;background-color:${MSC_EMAIL_INSET};font-family:Consolas,"SF Mono","Roboto Mono",ui-monospace,monospace;font-size:13px;letter-spacing:0.03em;color:${MSC_EMAIL_FOREGROUND};-webkit-font-smoothing:antialiased;">${msc_escHtml(invitePw!)}</td>
        </tr>
      </table>
      <p style="margin:14px 0 0;font-family:${MSC_EMAIL_FONT};font-size:12px;line-height:1.55;color:${MSC_EMAIL_DIM};-webkit-font-smoothing:antialiased;">Change this password under Profile after your first sign-in.</p>
    </td>
  </tr>
</table>`
    : ''

  const emailStyles = `
    body, table, td, p, a, h1 { -webkit-font-smoothing: antialiased; }
    .msc-body { font-family: ${MSC_EMAIL_FONT}; }
    .msc-body a.msc-cta,
    .msc-body a.msc-cta:visited,
    .msc-body a.msc-cta:hover {
      color: ${MSC_EMAIL_ACCENT_TEXT} !important;
      text-decoration: none !important;
    }
    .msc-textlink, .msc-textlink:visited { color: ${MSC_EMAIL_ACCENT} !important; text-decoration: none !important; }
    .msc-textlink:hover { text-decoration: underline !important; }
  `

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style type="text/css">${emailStyles}</style>
</head>
<body class="msc-body" style="margin:0;padding:0;background-color:${MSC_EMAIL_PAGE_BG};font-family:${MSC_EMAIL_FONT};">
<table role="presentation" class="msc-body" width="100%" cellpadding="0" cellspacing="0" style="background-color:${MSC_EMAIL_PAGE_BG};border-collapse:collapse;font-family:${MSC_EMAIL_FONT};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;border-collapse:collapse;">
        <tr>
          <td style="padding:28px 24px;border-radius:12px;border:1px solid ${MSC_EMAIL_CARD_BORDER};background-color:${MSC_EMAIL_CARD_BG};">
            <p style="margin:0;font-family:${MSC_EMAIL_FONT};font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MSC_EMAIL_DIM};">MSC-Projectz</p>
            <h1 style="margin:12px 0 0;font-family:${MSC_EMAIL_FONT};font-size:20px;font-weight:600;letter-spacing:-0.02em;color:${MSC_EMAIL_FOREGROUND};line-height:1.3;">${isInvite ? 'You&rsquo;re invited' : 'Verify your email'}</h1>
            <p style="margin:16px 0 0;font-family:${MSC_EMAIL_FONT};font-size:14px;line-height:1.65;color:${MSC_EMAIL_BODY};">${greetingHtml}</p>
            <p style="margin:12px 0 0;font-family:${MSC_EMAIL_FONT};font-size:14px;line-height:1.65;color:${MSC_EMAIL_BODY};">Please verify your email address to activate your account.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 0;border-collapse:collapse;">
              <tr>
                <td align="center" bgcolor="${MSC_EMAIL_ACCENT}" style="border-radius:10px;background-color:${MSC_EMAIL_ACCENT};mso-padding-alt:14px 32px;">
                  <a class="msc-cta" href="${msc_escHtml(input.verifyUrl)}" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;padding:14px 32px;font-family:${MSC_EMAIL_FONT};font-size:14px;font-weight:600;line-height:1;color:${MSC_EMAIL_ACCENT_TEXT} !important;text-decoration:none !important;border-radius:10px;">Verify email address</a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-family:${MSC_EMAIL_FONT};font-size:12px;line-height:1.6;color:${MSC_EMAIL_DIM};">Or paste this link into your browser:</p>
            <p style="margin:6px 0 0;font-family:${MSC_EMAIL_FONT};font-size:12px;line-height:1.5;word-break:break-all;color:${MSC_EMAIL_BODY};">${msc_escHtml(input.verifyUrl)}</p>
            <p style="margin:16px 0 0;font-family:${MSC_EMAIL_FONT};font-size:12px;line-height:1.5;color:${MSC_EMAIL_DIM};">This link expires in ${ttl} hours.</p>
            ${inviteHtmlBlock}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  return { subject, text, html }
}
