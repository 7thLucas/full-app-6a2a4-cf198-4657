# Thread — Design Guidelines

## Design principles
- **Speed and clarity first.** Every interaction in the core loop (add contact, log interaction, move a deal) should feel instant and obvious. Minimize clicks, fields, and friction.
- **Calm, focused surface.** Generous whitespace, restrained color, no visual clutter. The interface should recede so the user's contacts and deals are the focus.
- **"What needs attention next" is always visible.** Use color and placement to make overdue follow-ups and stale deals impossible to miss.

## Color
- Neutral, paper-like canvas. Background near-white/very light warm gray; surfaces clean white.
- Single confident accent (a calm indigo/blue) for primary actions, active states, and pipeline emphasis.
- Semantic colors used sparingly: amber for "needs attention soon", red for "overdue/stale", green for "on track / won".
- Text in deep slate, not pure black, for a softer, readable feel.

## Typography
- One clean, modern sans-serif (e.g., Inter or system UI stack).
- Clear hierarchy: bold, larger headings; comfortable body size; smaller muted metadata (timestamps, labels).
- Avoid decorative fonts. Legibility and scannability win.

## Layout & components
- **Pipeline board:** the centerpiece. Kanban-style columns per stage; cards show contact/deal name, last activity, and a clear "needs attention" indicator. Smooth drag-or-click to move between stages.
- **Contacts:** a clean, searchable list; quick-add that takes seconds.
- **Interaction logging:** a fast inline/modal capture for call/email/meeting/note with type, date, and a short note — minimal required fields.
- **Cards & surfaces:** soft rounded corners (~8-12px), subtle shadows/borders, no heavy chrome.
- **Empty states:** friendly and instructive, guiding the user into the core loop.

## Elevation & motion
- Subtle elevation: light shadows to separate cards and modals from the canvas.
- Quick, gentle transitions (150–200ms) for stage moves and modal open/close. Nothing flashy.

## Tone of UI copy
- Plain, warm, concise. Action-oriented labels ("Log interaction", "Add contact", "Move to Won").
- Encouraging empty/zero states. Never enterprise-y or jargon-heavy.