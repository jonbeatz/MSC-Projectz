/**
 * Root layout: pass-through so sibling route groups can each own the document.
 * - `app/(main)/layout.tsx` — Command Center, login, auth (`<html><body>` + SessionGuard)
 * - `app/(payload)/layout.tsx` — Payload admin/API (`RootLayout` full document)
 * Without this split, Payload's `RootLayout` would nest `<html>` inside the main `<body>` (invalid HTML, hydration errors).
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
