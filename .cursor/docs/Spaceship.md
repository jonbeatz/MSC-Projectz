# Infrastructure & Hosting: Spaceship Protocol

## Deploy SOP (Next / Payload on cPanel)

Use **`FlightPro.md`** for zip contents, `pushitlive`, unzip/restart, permissions, and troubleshooting. **`DeployUpdate.md`** is the ultra-short version.

## Hosting Details
- **Provider:** Spaceship
- **URL:** jon-beatz.com
- **Email:** Hosted via Spaceship
- **SMTP Provider:** FluentSMTP + Brevo.com

## SMTP Configuration
- **Host:** mail.spacemail.com
- **Port:** 465 (SSL)
- **Auth:** Requires App Password (check Spaceship Dashboard)

## CDNs & Media
- **Video:** Bunny.net 4K Streaming integration.
- **Security:** Wordfence/Solid Security (Planned).
- **MSC app media:** user uploads and generated files stay under project **`./media`**; deploy includes `media/` when present (see `msc_package_deploy.mjs` **COPY_PLAN**).