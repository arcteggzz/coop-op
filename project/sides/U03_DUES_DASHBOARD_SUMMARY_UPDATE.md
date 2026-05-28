# U03 — Dues Dashboard Summary Update

## Overview

This update replaces the "Coming Soon" placeholder sections across all three portals with a live **Dues Summary** widget. The dues feature has been fully implemented (backend + frontend). This task is about surfacing the right dues data on the three main dashboard/home screens so managers, admins, and members always see actionable information the moment they log in.

The change touches three routes:

- `http://localhost:5173/manager/dashboard` — Manager portal dashboard
- `http://localhost:5173/admin/cooperatives/:cooperativeId` — Back office admin cooperative detail page
- `http://localhost:5173/member/dashboard` — Member portal home screen

---

## Why This Matters

Before this update, the dues section on all three portals showed a static "Coming Soon" card. Now that dues is live, that placeholder is dead space. A manager logging in has no idea if 13 members are overdue. A member doesn't know their December dues are unpaid until they navigate away from the home screen. This update fixes that by making the dashboard answer the user's most urgent question the moment they land.

---

## The Dues Summary — Understanding the States

A cooperative's dues situation can be in several different states at any given time. The UI must handle all of them gracefully. Reference the design sketches at:

- `project/sides/U03_DUES_DASHBOARD_MANAGER_ADMIN.png` — manager and admin portal states
- `project/sides/U03_DUES_DASHBOARD_MEMBER.png` — member portal states

### State 1 — No dues configured

The cooperative exists but no dues have been set up yet. The manager/admin sees an empty state with a "Set up dues" CTA button that links to the dues setup page. Do not show a blank card or a loading spinner.

### State 2 — Dues configured but cycle has not started yet

One or more dues exist but the start date is in the future. No progress bars are shown — there is nothing to measure yet. Each upcoming due is shown as a compact row with a "Starts in X days" chip. The configured amount and member count are shown so the manager knows what to expect.

### State 3 — Single active due, cycle is running

The most common case. The card shows three aggregate stats at the top (members paid, members unpaid, total collected), then one progress row for the active due showing: due name, amount, progress bar, ₦collected of ₦expected, percentage, and days left in the cycle. An "X unpaid" badge is shown in danger or warning colour depending on severity.

### State 4 — Multiple dues active in the same cycle

Two or more dues are running simultaneously. For example, "Monthly dues ₦5,000" and "Development fund ₦2,000" both running in December. The card shows combined aggregate stats at the top (total members behind across all dues, total collected across all dues, total expected across all dues). Below that, each due gets its own progress row separated by a divider. Each row has a distinct colour so they are visually differentiable. The top 3 dues by urgency (lowest collection percentage first) are shown if there are more than 3; a "View all" link is shown.

### State 5 — Mixed: some active, some upcoming

At least one due has an active running cycle and at least one due has not started yet. Active dues are shown first with full progress rows. Upcoming dues are shown below as compact upcoming rows with a start date chip. Both are in the same card, visually separated.

### State 6 — All dues fully collected for the current cycle

Every member has paid every active due. Show a green completion state at the top of the card ("All members up to date"), total amount collected, and collapsed progress rows for each due showing 100%. This is a reward state — make it feel positive.

---

## Backend Update

### New endpoint required

Create endpoints that powers all three portals. Follow the existing route → controller → service → repository pattern exactly.

```
GET /api/dues/dashboard-summary/:cooperativeId
```

For the **member portal**, add an additional query param:

```
GET /api/dues/dashboard-summary/:cooperativeId?memberId=:memberId
```

When `memberId` is provided, the response also includes that specific member's payment status per due.

Endpoints should follow the token checks. if endpoint is called with member token, then extract the memberId from there.
If endpooint is called with admin id, then do the necessary admin permissions check. same thing if it's with manager's token... do the necessary manager permissions check.

### What the endpoint should return

The endpoint should return enough data to render all six states described above without the frontend needing to make additional calls. Shape the response as follows:

```json
{
  "cooperativeId": "string",
  "cycleLabel": "December 2024",
  "state": "active | upcoming | mixed | all_paid | no_dues",
  "aggregates": {
    "totalExpected": 609000,
    "totalCollected": 474000,
    "totalMembersBehind": 18,
    "activeDuesCount": 2,
    "upcomingDuesCount": 1
  },
  "activeDues": [
    {
      "dueId": "string",
      "name": "Monthly dues",
      "amount": 5000,
      "cycleStart": "2024-12-01",
      "cycleEnd": "2024-12-31",
      "daysLeft": 4,
      "paidCount": 74,
      "unpaidCount": 13,
      "totalExpected": 435000,
      "totalCollected": 370000,
      "percentageCollected": 85,
      "memberStatus": "paid | unpaid | partial"
    }
  ],
  "upcomingDues": [
    {
      "dueId": "string",
      "name": "Dev fund",
      "amount": 2000,
      "startDate": "2025-01-01",
      "daysUntilStart": 12,
      "memberCount": 87
    }
  ]
}
```

The `state` field is computed server-side so the frontend does not need conditional logic to determine which view to render — it just reads the state and picks the right component.

The `memberStatus` field is only populated when `memberId` is provided in the query.

### Rules to follow

- Add logging following the existing logging pattern used in other controllers and services
- Add Swagger JSDoc documentation to the new route following the format already in existing routes
- Follow the same error handling and response envelope shape used across the codebase
- Read from existing dues tables — do not create new tables for this
- The current cycle is determined by today's date falling between `cycleStart` and `cycleEnd` for each due

---

## Frontend Update

### Where the "Coming Soon" boxes live today

The "Coming Soon" placeholders to be replaced are:

1. **Manager portal** — `http://localhost:5173/manager/dashboard` — an empty/coming soon box already exists in the dues section of the dashboard. Replace its contents with the dues summary widget.
2. **Back office portal** — `http://localhost:5173/admin/cooperatives/:cooperativeId` — the cooperative detail page has a summary card section, then a wallets section, then a dues and levies section. The dues section shows "Coming Soon". Replace the dues section with the dues summary widget. The levies section stays as "Coming Soon" — do not touch it.
3. **Member portal** — `http://localhost:5173/member/dashboard` — the home screen currently has a "Following Actions" section that shows "Dues — Coming Soon" and "Loans — Coming Soon" as static placeholder tiles. This entire section should be replaced with the new "Dues & payments" live section described below.

---

### Manager and Back office portal — dues summary widget

Both portals are visually similar (sidebar + topbar + main content area). Apply the same dues summary widget to both. The widget should:

- Call `GET /api/dues/dashboard-summary/:cooperativeId` on mount
- Show a loading skeleton while fetching
- Render the correct state based on the `state` field in the response
- Use the existing card component style, table look and feel, and colour tokens already used across the manager and admin portals
- Use the existing portal theme — do not introduce new colours or component patterns
- "View all" / "Details" links should navigate to the existing dues list page for that portal
- "Set up dues" CTA should navigate to the dues creation page for that portal
  The card sits in the dashboard grid. Its height should be consistent whether it is showing one due or three — use a max of 3 due rows before truncating with a "View all X dues" link.

Render the six states as follows:

| State               | What to show                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `no_dues`           | Empty state illustration + "Set up dues" button                              |
| `upcoming`          | Compact upcoming rows with "Starts in X days" chip per due                   |
| `active` (single)   | 3 aggregate stats + 1 progress row                                           |
| `active` (multiple) | 3 combined aggregate stats + 1 progress row per due (max 3) + dividers       |
| `mixed`             | Active dues as full progress rows first, upcoming dues as compact rows below |
| `all_paid`          | Green completion header + collapsed 100% progress rows per due               |

---

### Member portal — "Dues & payments" section

Replace the entire "Following Actions" section (currently showing "Dues — Coming Soon" and "Loans — Coming Soon" tiles) with a new section titled **"Dues & payments"**.

This section is on a mobile-width layout (max-width 380–410px). Keep all cards compact, touch-friendly, and vertically stacked.

Call `GET /api/dues/dashboard-summary/:cooperativeId?memberId=:memberId` on mount.

Render cards in this priority order — show only what is relevant:

**1. Unpaid dues (if any)** — show a card per unpaid due. Each card shows: due name, amount as large text, cycle period and deadline as subtext, a red/orange "Unpaid" pill, and a full-width "Pay now" button in the cooperative's purple. Tapping "Pay now" navigates to the dues payment flow.

**2. Open unpaid levies (if any)** — show a compact warning-coloured card per open levy. Shows levy name, amount, and deadline. Tapping navigates to the levy payment flow. _(Note: levies data can be stubbed or omitted for now if the levies feature is not yet wired — show nothing rather than an error.)_

**3. Active loan (if any)** — show a compact card with loan name, repayment progress bar, percentage repaid, and next repayment date + amount. Show an "On track" or "Overdue" pill. Do not show a pay button here — loan repayments are automatic.

**4. Paid dues (current cycle)** — if all dues are paid, show a compact green confirmation card per due: checkmark icon, "X dues cleared", date paid. No button needed.

**5. Upcoming dues (not started)** — show a quiet info card: due name, amount, "Starts in X days" chip. No button.

**6. No loans** — show a minimal dashed card: "No active loans" with a soft "Apply for a loan →" link.

**7. Nothing at all** — if there are no dues, no loans, no levies: show a single quiet card saying "Nothing due right now. You're all caught up." Do not leave the section empty.

The section title should read **"Dues & payments"** in the same style as the existing "Quick Actions" and "Recent Activity" section titles on that screen.

---

## What Not to Touch

- Do not modify the levies section anywhere — it stays as "Coming Soon"
- Do not modify the wallet card, summary stats, quick actions, or recent activity sections
- Do not change routing or auth logic
- Do not introduce new npm packages
- Do not rename or restructure existing dues feature files

---

## Acceptance Checklist

- [ ] `GET /api/dues/dashboard-summary/:cooperativeId` returns correct data for all 6 states
- [ ] `?memberId=` param returns correct `memberStatus` per due
- [ ] Manager dashboard dues card renders all 6 states correctly
- [ ] Admin cooperative detail page dues card renders all 6 states correctly
- [ ] Member home screen "Dues & payments" section renders all priority states correctly
- [ ] Loading skeletons shown while fetching on all three portals
- [ ] Empty/error states handled gracefully — no blank sections or unhandled exceptions
- [ ] Levies section untouched and still shows "Coming Soon" on all portals
- [ ] All new code follows existing logging, error handling, and response patterns
- [ ] Swagger docs added for the new endpoint
