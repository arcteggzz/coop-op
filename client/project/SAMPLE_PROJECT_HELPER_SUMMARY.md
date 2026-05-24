# Sample Project Reference Summary

Quick-reference guide derived from scanning `sample_client/`. Use this when building the coop-op frontend — both projects share the same tech stack, 3-portal structure, and wallet provider (Embedly/Sterling Bank).

---

## Tech Stack

- React 18 + TypeScript (all `.tsx`/`.ts`, no `.js`)
- Vite 6 (build tool), React Router v7
- Tailwind CSS v4 + Radix UI / shadcn components (in `src/app/components/ui/`)
- axios — single shared instance with interceptors
- @tanstack/react-query v5 — all server state
- react-hook-form — all forms
- sonner — toast notifications
- lucide-react — icons
- recharts — charts

---

## Folder Structure

```
src/
├── main.tsx               # QueryClient + AuthProvider + Toaster setup
├── app/
│   ├── App.tsx            # RouterProvider wrapper
│   ├── routes.tsx         # All routes (3 portals, public + protected)
│   ├── api/               # Raw axios calls ONLY — no UI, no state
│   │   ├── axiosInstance.ts
│   │   ├── schoolAuth.api.ts
│   │   ├── schoolDashboard.api.ts
│   │   └── ...
│   ├── components/
│   │   ├── SchoolLayout.tsx    # Sidebar layout shell
│   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   └── ui/                 # shadcn components — never modify
│   ├── context/
│   │   └── AuthContext.tsx     # Single auth source of truth
│   └── pages/
│       ├── PortalSelection.tsx
│       ├── school/             # Manager-equivalent portal
│       ├── parent/             # Member-equivalent portal
│       └── acadify-admin/      # Back-office admin portal
└── styles/
    ├── theme.css          # CSS variables (colors, radius, sidebar)
    └── tailwind.css
```

> **Coop-op difference**: `PROJECT_RULES_FE.md` adds a `hooks/` folder — query logic goes there, not inline in pages.

---

## API Architecture

- One axios instance (`axiosInstance.ts`), reads `VITE_API_BASE_URL`
- **Request interceptor**: auto-attach JWT from `localStorage.getItem('coop_token')`
- **Response interceptor**: on 401 → clear storage → `window.location.href = '/'`
- API files export plain async functions, no state/UI inside them
- Response shape from backend is always `{ success: boolean; data: T }`
- Error helper (export from axiosInstance):
  ```ts
  export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error))
      return error.response?.data?.error?.message ?? "Something went wrong";
    return "Something went wrong";
  }
  ```

---

## Auth Flow

- **Storage keys**: `coop_token`, `coop_user`, `coop_user_type`
- On login → call API → `auth.login(token, user, type)` → saves to localStorage + state
- On app mount → AuthContext re-hydrates from localStorage (no logout on refresh)
- On logout → clear all 3 keys + reset state + navigate to portal login
- `useAuth()` hook exported from `AuthContext.tsx`

---

## Route & Protection Pattern

```tsx
// Public routes — no wrapper
{ path: '/manager/login', element: <ManagerLogin /> }

// Protected routes
{
  path: '/manager/dashboard',
  element: (
    <ProtectedRoute userType="manager">
      <ManagerLayout>
        <ManagerDashboard />
      </ManagerLayout>
    </ProtectedRoute>
  )
}
```

- `ProtectedRoute` checks both `isAuthenticated` AND `userType === expected`
- Redirect to `/` if either check fails

---

## React Query Setup

```tsx
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
```

- `useQuery` for all GETs; `useMutation` for all POST/PATCH/DELETE
- Query keys: kebab-case strings in arrays → `['members']`, `['manager-wallet']`
- On mutation success → `queryClient.invalidateQueries({ queryKey: [...] })`
- Toasts: `toast.success(...)` on success, `toast.error(getErrorMessage(err))` on error

---

## Design System

### Colors (use inline or via Tailwind tokens)

| Token          | Hex                                                                | Usage                         |
| -------------- | ------------------------------------------------------------------ | ----------------------------- |
| Primary blue   | `#426af2`                                                          | CTAs, active nav, links       |
| Blue gradient  | `linear-gradient(135deg, rgb(66,106,242) 0%, rgb(52,88,213) 100%)` | Primary buttons, wallet cards |
| Dark sidebar   | `#1a2332`                                                          | Sidebar background            |
| Page bg        | `#fafbfd`                                                          | Main content area             |
| Card bg        | `#ffffff` + `border border-[#f3f4f6]`                              | All cards/tables              |
| Text primary   | `#101828`                                                          | Headings, values              |
| Text secondary | `#6a7282`                                                          | Labels, subtitles             |
| Text muted     | `#99a1af`                                                          | Counts, helper text           |
| Sidebar text   | `#8b92a7`                                                          | Inactive nav items            |
| Sidebar border | `#2a3442`                                                          | Dividers inside sidebar       |
| Success green  | `#00a87a`                                                          | Paid amounts, success states  |
| Warning orange | `#ff9f43`                                                          | Pending, warning states       |
| Error red      | `#ff6b6b` / `#ef4444`                                              | Errors, cancelled             |

### Typography

- Font: `Albert_Sans` (used as inline style: `font-['Albert_Sans',sans-serif]`)
- Page title: `font-bold text-[28px] text-[#101828]`
- Section title: `font-bold text-[20px]` / `text-[18px]`
- Card label: `text-[13px] text-[#6a7282] font-medium`
- Card value: `font-bold text-[32px]` (large stat) or `text-[28px]`
- Table header: `text-[12px] font-semibold text-[#6a7282] uppercase tracking-wide`
- Table cell: `text-[14px] text-[#101828]`

### Spacing & Radius

- Page content padding: `p-8`
- Section gap: `mb-8`, `my-10`, `my-12`
- Card: `rounded-[12px]`, Modal/wallet card: `rounded-[16px]`
- Button/input/nav item: `rounded-[8px]` or `rounded-[10px]`
- Shadow: `shadow-sm` (cards), `shadow-2xl` (modals)

---

## Layout Shell Pattern (Sidebar)

flex h-screen
├── Sidebar w-64 bg-[#1a2332]
│ ├── Logo block (border-b border-[#2a3442])
│ ├── Nav items (flex-1, space-y-1)
│ │ └── Active: bg-[#426af2] text-white
│ │ Inactive: text-[#8b92a7] hover:bg-[#2a3442] hover:text-white
│ └── User profile + logout (border-t border-[#2a3442])
└── Main flex-1 flex flex-col overflow-hidden
├── Top bar bg-white border-b border-[#f3f4f6] px-8 py-4
│ └── Welcome text + avatar
└── Content flex-1 overflow-auto
└── <children /> (p-8 inside each page)

```

---
```

## Stat Cards Pattern

```tsx
<div className="bg-white rounded-[12px] p-6 border border-[#f3f4f6] shadow-sm">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-[rgba(66,106,242,0.1)] rounded-xl">
      <Icon className="text-[#426af2]" size={20} />
    </div>
    <p className="text-[13px] text-[#6a7282] font-medium">Label</p>
  </div>
  <p className="font-bold text-[32px] text-[#101828]">₦12,000</p>
  <p className="text-[12px] text-[#99a1af]">42 records</p>
</div>
```

- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6`
- Icon background opacity trick: `bg-[rgba(hex,0.1)]` matches icon color at low opacity

---

## Modal Pattern

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* backdrop */}
  <div className="absolute inset-0 bg-black/40" onClick={onClose} />
  {/* card */}
  <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-[400px] mx-4 p-8">
    {/* content */}
  </div>
</div>
```

- Multi-step modals use `const [step, setStep] = useState<'form' | 'confirm'>('form')`
- Always close on backdrop click

---

## Table Pattern

```tsx
<div className="bg-white rounded-[12px] border border-[#f3f4f6] overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
          <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wide">
            Column
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-[#f3f4f6] hover:bg-[#fafbfd] transition-colors last:border-0">
          <td className="px-5 py-4 text-[14px] text-[#101828]">Value</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Loading State Patterns

```tsx
// Skeleton cards (animate-pulse)
{isLoading ? (
  Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="bg-white rounded-[12px] p-6 animate-pulse border border-[#f3f4f6]">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  ))
) : data.length === 0 ? (
  <EmptyState />
) : (
  <ActualContent />
)}

// Table skeleton rows
{isLoading
  ? Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b animate-pulse">
        {Array.from({ length: colCount }).map((__, j) => (
          <td key={j} className="px-5 py-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
          </td>
        ))}
      </tr>
    ))
  : rows.map(...)
}

// Button spinner
<button disabled={isPending}>
  {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
</button>
// OR: {isPending ? 'Creating...' : 'Create'}
```

---

## Wallet Card Pattern

```tsx
<div
  className="rounded-2xl p-6 text-white flex flex-col gap-4"
  style={{
    backgroundImage:
      "linear-gradient(135deg, rgb(66,106,242) 0%, rgb(52,88,213) 100%)",
  }}
>
  <div className="flex items-center justify-between">
    <p className="font-semibold text-[15px] opacity-90">Wallet Name</p>
    <button className="p-1.5 bg-white/20 rounded-xl hover:bg-white/30">
      <Eye size={16} /> {/* toggle balance visibility */}
    </button>
  </div>
  <p className="font-bold text-[28px]">₦ ••••••</p> {/* or actual balance */}
  <div className="text-[13px] opacity-80">
    <p>
      Account: <span className="font-semibold">1234567890</span>
    </p>
    <p>
      Bank: <span className="font-semibold">Sterling Bank</span>
    </p>
  </div>
  <div className="flex gap-2 mt-1">
    <button className="flex-1 bg-white/10 text-white px-3 py-2 rounded-xl text-[12px] font-semibold border border-white/20">
      View Transactions
    </button>
  </div>
</div>
```

---

## Primary Button Pattern

```tsx
<button
  className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-white font-semibold text-[13px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
  style={{
    backgroundImage:
      "linear-gradient(135deg, rgb(66,106,242) 0%, rgb(52,88,213) 100%)",
  }}
>
  <Plus size={16} />
  Add Something
</button>
```

---

## Status Badges / Pill Pattern

```tsx
// Color-coded pill
<span
  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
  style={{ backgroundColor: ratePillBg, color: ratePillText }}
>
  Active
</span>

// Green = paid/success, Orange = pending, Red = failed/cancelled
```

---

## Multi-Portal Notes

- Sample project portals: **School** (≈ Manager), **Parent** (≈ Member), **Acadify Admin** (≈ Back Office)
- Coop-op maps to: **Manager portal**, **Member portal**, **Admin portal**
- All portals share the same sidebar layout pattern (different nav items, same shell)
- Each portal has its own login page, own `ProtectedRoute` type check, own API files
- Portal selection page (`/`) lets user pick which portal to enter

---

## Key Rules to Remember

- Never call axios directly in a page — always go through hooks (coop-op rule) or API files
- Never hardcode URLs — always `import.meta.env.VITE_API_BASE_URL`
- No new CSS files — Tailwind utilities only
- No new libraries without approval
- `src/app/components/ui/` is shadcn — do not edit those files
- Always show skeleton while loading, always show toast on mutation result
- `getErrorMessage(error)` for all error toasts — never raw `error.message`
