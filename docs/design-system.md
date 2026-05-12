# IWAP Design System

## Design Direction

IWAP uses a warm editorial enterprise style: calmer and more considered than a typical blue SaaS dashboard, but still dense enough for real workflow operations. The interface should feel like an AI operations console that a manager, SI customer, or startup founder can trust during a demo.

The visual inspiration is a warm cream, coral, and dark product-surface rhythm. IWAP does not copy another company's logo, glyphs, brand names, or proprietary typefaces. Instead, it adapts the underlying design principles into a distinct portfolio product identity.

## Product Personality

- Warm, professional, and editorial.
- Enterprise-friendly rather than playful.
- Product-first: the first screen shows the actual chat command surface and live agent timeline.
- Dark surfaces are reserved for workflow execution, agent logs, code-like tool calls, and audit details.
- Coral is used for primary action and high-value callout moments, not as decoration everywhere.

## Color Tokens

IWAP keeps the warm editorial base, but balances it with dark operational surfaces and restrained neutral panels so the product does not become a one-note beige UI.

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#faf9f5` | Main page background. |
| `--surface-soft` | `#f5f0e8` | Secondary bands and sidebar background. |
| `--surface-card` | `#efe9de` | Feature cards and light panels. |
| `--surface-plain` | `#fffefa` | Data tables and dense operational panels. |
| `--surface-dark` | `#181715` | Agent timeline, logs, footer, product chrome. |
| `--surface-dark-elevated` | `#252320` | Panels inside dark surfaces. |
| `--primary` | `#cc785c` | Primary CTA, active workflow action, key highlights. |
| `--primary-active` | `#a9583e` | Pressed/active primary action. |
| `--accent-teal` | `#5db8a6` | Live connector and success activity indicators. |
| `--accent-amber` | `#e8a55a` | Approval-needed and pending states. |
| `--ink` | `#141413` | Main text. |
| `--body` | `#3d3d3a` | Body text. |
| `--muted` | `#6c6a64` | Secondary text and metadata. |
| `--hairline` | `#e6dfd8` | Light borders. |
| `--success` | `#5db872` | Completed states. |
| `--warning` | `#d4a017` | Approval and caution states. |
| `--error` | `#c64545` | Failed states. |

## Typography

Public, easy-to-install fonts are used:

- Display: `Cormorant Garamond`, `EB Garamond`, Georgia, serif.
- Body/UI: `Inter`, system sans-serif.
- Code/logs: `JetBrains Mono`, monospace.

Implementation note: display headings use regular or medium weight with `letter-spacing: 0`. The source design references negative tracking, but IWAP keeps spacing stable for predictable rendering across browsers and Korean/English mixed text.

## Layout

- Maximum content width: `1200px`.
- Major section spacing: `96px` on desktop, `56px` on mobile.
- Dashboard layout: left navigation, main workspace, optional right insight panel.
- Main screen: command composer on the left/top and live agent timeline on the right/bottom depending on viewport.
- Workflow cards use stable dimensions so status changes do not shift the layout.

## Core Screens

### Main Command Center

The first screen must immediately prove the product:

- Natural-language command input.
- Demo scenario shortcuts.
- Live multi-agent timeline.
- Current workflow status.
- Approval prompt when required.
- Generated report preview.

### Workflow Dashboard

Operational overview for running and completed workflow runs:

- Status cards.
- Agent progress.
- Tool usage summary.
- Recent failures and approvals.

### Approval Inbox

Human-in-the-loop control surface:

- Risk reason.
- Requesting agent.
- Tool/action to be executed.
- Approve and reject actions.
- Audit note input.

### History And Audit

Traceable execution history:

- Workflow list.
- Agent event timeline.
- Tool call payload/result summaries.
- Generated report links.

## Components

### Buttons

- Primary: coral background, white text, 8px radius.
- Secondary: warm surface background, hairline border, ink text.
- Dark secondary: dark elevated background, warm text.
- Icon buttons: circular, 36px, with tooltips.

### Cards

- Light workflow cards: warm light surface, 8-12px radius, hairline border only when needed.
- Dark agent cards: dark background for logs, tool calls, execution traces.
- Approval cards: amber accent marker, clear risk reason, compact action row.

### Inputs

- Warm surface background.
- 8px radius.
- Coral focus ring.
- Command input should feel like a serious operator console, not a marketing search box.

### Timeline

The agent timeline is the signature UI element:

- Planner, Executor, Validator, Reporter, Notifier rows.
- Each event shows status, timestamp, message, and optional tool metadata.
- Dark surface variant is preferred for the primary live execution panel.

## Responsive Behavior

- Mobile uses a single-column command center.
- Agent timeline remains readable with fixed font sizes and horizontal scrolling only for code/log fragments.
- Dashboard cards collapse by column count, not by shrinking text.
- Touch targets stay at least 40px high.

## Do

- Show actual product chrome early.
- Use dark surfaces for agent execution and audit detail.
- Keep coral scarce and meaningful.
- Use clear business labels rather than abstract AI marketing text.
- Make generated reports and tool calls visible in the UI.

## Do Not

- Do not copy Anthropic, Claude, or any third-party logo marks.
- Do not build a pure marketing landing page as the first experience.
- Do not use a generic blue SaaS palette.
- Do not flood the page with coral accents.
- Do not rely on decorative gradients or abstract blobs.
- Do not hide the workflow mechanics behind vague AI copy.
