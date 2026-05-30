# U04 — Dues Detail Page Upgrade: Multi-View Table

## Overview

This update upgrades the dues detail page on **both the manager portal and the back office admin portal**. Currently the page shows a single table of periods/cycles for a due. This update introduces a **three-view switcher** that lets the manager or admin toggle between different perspectives of the same due's data. The summary cards at the top respond to whichever view is active.

The active view is controlled by a `view` query parameter in the URL so that views are bookmarkable, shareable, and survive a page refresh.

---

## Affected Pages

### Manager portal

```
/manager/dues/:dueId?view=periods
/manager/dues/:dueId?view=all
/manager/dues/:dueId?view=member-details
```

### Back office admin portal

```
/admin/cooperatives/:cooperativeId/dues/:dueId?view=periods
/admin/cooperatives/:cooperativeId/dues/:dueId?view=all
/admin/cooperatives/:cooperativeId/dues/:dueId?view=member-details
```

The back office dues detail page is functionally identical to the manager dues detail page. Apply all the same changes to both. Both portals call their own backend endpoints which you will create and make subject to the normal permissions setup that we have — the `cooperativeId` context is already available via the existing auth/route context on the back office side.

**Default view** when no `view` query param is present: `periods`. This preserves existing behaviour for anyone who has bookmarked or linked to the page without a query param.

---

## Query Param Behaviour

The `view` query param drives which tab is active and which table is rendered.

- Switching tabs updates the URL query param using `replaceState` (no new history entry — the back button should not cycle through view switches).
- Selecting a member in the `member-details` view adds a `memberId` query param: `?view=member-details&memberId=:memberId`. This means a specific member view is also bookmarkable/shareable.
- On page load, read `view` and `memberId` from the URL and initialise state accordingly. If `view=member-details` and a valid `memberId` is present, immediately fetch and show that member's data without requiring the user to re-select.
- If an unrecognised `view` value is in the URL, fall back to `periods` silently.

Valid query param values:
| `view=` | Tab shown |
|---|---|
| `periods` | Periods tab (default) |
| `all` | All payments tab |
| `member-details` | By member tab |

---

## The Three Views

### View 1 — Periods (`?view=periods`)

This is what the page already shows. One row per cycle/period. The table remains exactly as it is today. This is the default view when the page loads.

**Summary cards show:**

- Total collected — sum across all cycles of this due
- Total owing — sum across all cycles of this due
- Periods issued — count of all cycles created for this due

**Table columns (unchanged):**
Period | Due Date | Members | Expected | Collected | Pending | Actions (View Members)

---

### View 2 — All payments (`?view=all`)

A flat list of every individual payment transaction for this due, regardless of cycle. This is equivalent to querying:

```sql
SELECT
et.TransactionReference,
dp.*
FROM DuePayments dp
left join EmbedlyTransactions et on et.TransactionReference = coalase('COOP-DUES-',dp.Id)
WHERE DueId = :dueId
ORDER BY DateCreated ASC, DueDate ASC;
```

No grouping by cycle. Every payment is its own row. Useful for investigating a specific transaction, spotting a gap, or exporting a clean ledger.

**Summary cards show (same as View 1):**

- Total collected — sum of all payments for this due
- Total owing — total expected minus total collected
- Periods issued — total number of cycles (unchanged)

**Table columns:**
Member Name | Period | Due Date | Amount Expected | Amount Paid | Payment Date | Status | Payment Ref | Actions

- Member Name: the name of the member who made the payment
- Period: which cycle this payment belongs to (e.g. "June 2026")
- Amount: the amount paid
- Payment Date: date and time the payment was made — follow the existing date format used across the codebase (DD MMM YYYY, HH:mm)
- Payment Method: wallet, cash override, etc.
- Status: paid, pending, overridden
- Reference: payment reference or transaction ID if available

The table should be filterable by Period (dropdown of available cycles) and by Status. Sortable by Payment Date.

---

### View 3 — By member (`?view=member-details`)

A member-scoped view. The manager or admin selects a member and sees all their payment records for this due across every cycle they were enrolled in. This answers the question: "How has this specific member been performing on this due?"

When this view is selected, a **member selector** appears above the table — a searchable dropdown showing all members in this cooprative. The table and summary cards remain at cooperative-level defaults until a member is selected.

If `?view=member-details&memberId=:memberId` is present on load, skip the empty state and immediately fetch and render that member's data.

Once a member is selected (or loaded from URL):

**Summary cards update to show that member's data:**

- Total paid — total amount this member has paid for this due across all cycles
- Total owed — total amount this member still owes across all cycles (expected minus paid)
- Cycles enrolled — number of cycles this member was part of for this due

The summary card **labels** change, not just the values. "Total collected" → "Total paid", "Total owing" → "Total owed", "Periods issued" → "Cycles enrolled". This signals clearly that the view is now member-scoped.

When no member is selected (view=member-details but no memberId), show the cooperative-level summary card values with default labels, and show a quiet empty state in the table: "Select a member above to view their payment history."

**Table columns:**
Period | Due Date | Amount Expected | Amount Paid | Payment Date | Status | Payment Ref | Actions

- Period: the cycle (e.g. "June 2026")
- Due Date: the deadline for that cycle
- Amount expected: what this member owed for that cycle
- Amount paid: what they actually paid
- Payment date: when they paid (empty if unpaid)
- Status: paid, pending, overridden
- Payment Ref: the tranx ref for that payment
- Actions: mark as paid (manual override for cash payments), send reminder

Rows where status is pending/unpaid should use the existing warning/danger row treatment already in the codebase.

---

## The View Switcher UI

Place a **segmented control** (3-tab toggle) directly above the table, below the existing summary cards.

Tab labels:

- `Periods`
- `All payments`
- `By member`

On tab click, update the URL using `replaceState` to set the `view` query param. Do not push a new history entry. The tab change should feel instant — update local state immediately, then fetch data in the background with a loading skeleton on the table.

When `By member` tab is active, render a searchable member dropdown between the tab switcher and the table.

---

## Backend Updates

### Existing endpoint (no change needed)

The periods view already works. Do not touch the existing endpoint that powers the periods table.

### New endpoint — all payments view

```
GET /api/dues/:dueId/payments
```

Query params:

- `cycleId` (optional) — filter to a specific cycle
- `status` (optional) — filter by payment status: paid, pending, overridden
- `page`, `limit` — pagination

Returns a flat list of all DuePayment records for this due, joined with member name and cycle/period label. Follow the existing pagination and response envelope shape used across the codebase.

### New endpoint — by member view

```
GET /api/dues/:dueId/payments/member/:memberId
```

Returns:

- Member summary: `{ totalPaid, totalOwed, cyclesEnrolled }`
- Payment records: one row per cycle the member was enrolled in, with fields: `period`, `dueDate`, `amountExpected`, `amountPaid`, `paymentDate`, `status`

### New endpoint — member list for selector dropdown

```
GET /api/coperative/:coperativeId/members
```

Returns a lightweight list of all members enrolled in this due: `{ memberId, fullName }`. Used to populate the member selector dropdown. If this endpoint already exists elsewhere in the dues feature, reuse it — do not create a duplicate.

**Rules for all new endpoints:**

- Follow the route → controller → service → repository pattern exactly as used in the existing dues feature
- Add logging following the existing logging pattern used in other controllers and services
- Add Swagger JSDoc documentation following the format already used in existing routes
- Follow the same error handling and response envelope shape used across the codebase
- These endpoints are shared by both portals — no portal-specific endpoint variants needed

---

## Frontend Implementation Notes

### Applies to both portals

Apply all frontend changes to both the manager dues detail page and the back office admin dues detail page. Both pages should behave identically. If there is a shared component between the two already, update it once. If they are separate page components, update both.

### Component structure after this update

1. Page header (due name, status badge, metadata) — unchanged
2. Navigation row (Back to Schedules + action buttons) — unchanged
3. Summary cards (3 cards — labels and values change based on active view and selected member)
4. **View switcher tabs** (new)
5. **Member selector dropdown** (new — only visible when `view=member-details`)
6. Table (content changes based on active view)

### URL sync

Use the router's query param API (not `window.location` directly) to read and write the `view` and `memberId` params. On mount, read the params and set initial state. On tab switch or member selection, call `replaceState` via the router — do not use `pushState`. This way the back button takes the user back to whatever they were doing before they opened this page, not cycling through view switches.

### State management

Track in local component state:

- `activeView`: `'periods' | 'all' | 'member-details'` — initialised from `?view=` on mount, defaults to `'periods'`
- `selectedMemberId`: string or null — initialised from `?memberId=` on mount if `view=member-details`
- `selectedMemberName`: string or null — for display in the dropdown
- Pagination state per view (reset to page 1 when switching views or selecting a new member)

### Loading and empty states

- Show a loading skeleton on the table area whenever fetching data for a newly selected view or member
- Empty state if a view returns no records: "No payments recorded yet"
- By member view, no member selected: "Select a member above to view their payment history" — centred, muted text, no illustration
- Follow existing empty state and loading skeleton patterns in the codebase

### Existing behaviour to preserve

- "View Members" action on the Periods table row — keep exactly as is
- Deactivate and Issue Period buttons — do not touch
- Back to Schedules navigation — do not touch
- All existing due metadata in the page header — do not touch

---

## What Not to Touch

- The periods table existing behaviour and drill-down to cycle member detail
- The due detail page header, metadata, and top action buttons
- Any other dues pages (list page, create page, cycle member detail)
- Any non-dues features
- Routing, auth, or middleware

---

## Acceptance Checklist

- [ ] Manager portal dues detail page has three-tab switcher
- [ ] Back office admin dues detail page has three-tab switcher (same behaviour)
- [ ] Default view on load (no query param) is `periods` on both portals
- [ ] Tab switches update URL query param using replaceState (no new history entries)
- [ ] `?view=periods` shows existing periods table unchanged
- [ ] `?view=all` shows flat payment list with correct columns, filter by cycle and status
- [ ] `?view=member-details` shows member selector dropdown
- [ ] `?view=member-details&memberId=:id` on load skips empty state and shows member data immediately
- [ ] Member selector is searchable and lists all members enrolled in the due
- [ ] Selecting a member updates URL to add `memberId` param and fetches member data
- [ ] Summary cards show cooperative-level totals for `periods` and `all` views
- [ ] Summary cards show member-level totals with updated labels for `member-details` when member is selected
- [ ] Summary cards fall back to cooperative-level labels and values when no member is selected in `member-details`
- [ ] Loading skeletons shown on table during all fetches
- [ ] All three new backend endpoints follow existing patterns (logging, swagger, error handling)
- [ ] Existing "View Members" drill-down on periods table still works on both portals
- [ ] No regressions on existing dues detail page behaviour on either portal
