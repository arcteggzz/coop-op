# Project Rules – Frontend (React / TypeScript)

This document defines the rules and standards the AI must follow when generating code for this project.
All generated code must adhere to these conventions.

---

## 1. Technology Stack

The frontend must use the following stack:

- **React 18.3.1** (peer dependency, already installed)
- **TypeScript** — all files must be `.tsx` or `.ts`, no plain `.js`
- **Vite 6** — build tool and dev server
- **React Router v7** — client-side routing (already installed)
- **Tailwind CSS v4** — styling (already installed)
- **Radix UI / Shadcn components** — UI primitives (already installed in `src/app/components/ui/`)
- **axios** — HTTP client for all API calls (**must install**)
- **@tanstack/react-query** — server state, loading states, caching (**must install**)
- **react-hook-form** — all forms (already installed)
- **sonner** — toast notifications (already installed)
- **lucide-react** — icons (already installed)

The AI must not introduce additional libraries unless explicitly approved.

---

## 2. Dependencies to Add

| Package                 | Version | Why                                                                                                                                         |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `axios`                 | latest  | HTTP client — cleaner than `fetch`, supports request/response interceptors needed to inject JWT token on every request automatically        |
| `@tanstack/react-query` | latest  | Server state management — handles loading, error, and success states automatically; avoids manual `useState` boilerplate for every API call |

Everything else needed (toasts, forms, routing, UI) is **already installed**.

---

## 3. Project Folder Structure

The base folder for the frontend is `/client`. Everything outside this folder is beyond the scope of the frontend.

```
client/src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   ├── components/
│   │   ├── ManagerLayout.tsx
│   │   ├── ProtectedRoute.tsx         ← NEW: guards authenticated routes
│   │   ├── figma/
│   │   └── ui/                        (existing Shadcn components — do not modify)
│   ├── context/
│   │   └── AuthContext.tsx            ← NEW: auth state (user, token, type, login, logout)
│   ├── api/
│   │   ├── axiosInstance.ts           ← NEW: single axios instance + interceptors
│   │   ├── ManagerAuth.api.ts          ← NEW: Manager signup/login API calls
│   │   ├── ManagerDashboard.api.ts     ← NEW: wallet, summary, wallet history
│   │   ├── invoice.api.ts             ← NEW: invoices CRUD + summary + toggle paid
│   │   ├── student.api.ts             ← NEW: Manager-side student list + get one
│   │   ├── memberAuth.api.ts          ← NEW: member register/login
│   │   └── memberDashboard.api.ts     ← NEW: add child, list children, get child
│   ├── hooks/
│   │   ├── useManagerAuth.ts           ← NEW: React Query hooks wrapping Manager auth calls
│   │   ├── useManagerDashboard.ts
│   │   ├── useInvoices.ts
│   │   ├── useStudents.ts
│   │   ├── useMemberAuth.ts
│   │   └── useMemberDashboard.ts
│   └── pages/
│       ├── PortalSelection.tsx        (existing)
│       ├── Manager/                    (existing pages — will be modified to use real APIs)
│       └── member/                    (existing pages — will be modified to use real APIs)
└── main.tsx
```

Rules:

- `api/` files contain only the raw axios calls — no UI logic, no state
- `hooks/` files wrap API calls with React Query — no direct axios calls in page components
- Page components call hooks only — no direct API or axios calls in pages
- `context/AuthContext.tsx` is the single source of truth for auth state

---

## 4. Environment Variables

Vite exposes env vars with the `VITE_` prefix via `import.meta.env`.

### Files

```
client/.env.development      ← local dev (ngrok or localhost)
client/.env.staging          ← Render staging deployment
client/.env.production       ← production deployment
```

### Variables

```
VITE_API_BASE_URL=
```

### Usage

```ts
// Never hardcode API URLs. Always use:
import.meta.env.VITE_API_BASE_URL;
```

### Switching environments

- **Dev**: `npm run dev` → uses `.env.development`
- **Staging build**: `vite build --mode staging` → uses `.env.staging`
- **Production build**: `vite build` → uses `.env.production`

---

## 5. Axios Setup (`api/axiosInstance.ts`)

A single shared axios instance is created once and reused everywhere.

```ts
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: automatically attach JWT token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("coop_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401, clear auth and redirect to login
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("coop_token");
      localStorage.removeItem("coop_user");
      localStorage.removeItem("coop_user_type");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);
```

All `api/*.api.ts` files import from this instance — never from axios directly.

---

## 6. JWT Token Storage

**Choice: `localStorage`**

Reason: MVP simplicity. No server-side session management needed. The backend already issues stateless JWTs.

| Key              | Contents                                      |
| ---------------- | --------------------------------------------- |
| `coop_token`     | Raw JWT string                                |
| `coop_user`      | JSON string of user object (without password) |
| `coop_user_type` | `'Manager'` or `'member'`                     |

Rules:

- Never store passwords in any form
- Always parse user from JSON: `JSON.parse(localStorage.getItem('coop_user') ?? 'null')`
- On logout: `localStorage.removeItem` all three keys
- The axios interceptor reads `coop_token` automatically on every request

---

## 7. Auth State Management (`context/AuthContext.tsx`)

**Choice: React Context** (no Zustand, no Redux — not needed for this app size)

The `AuthContext` wraps the whole app and exposes:

```ts
interface AuthContextValue {
  token: string | null;
  user: ManagerUser | GuardianUser | null;
  userType: "Manager" | "member" | null;
  isAuthenticated: boolean;
  login: (token: string, user: object, type: "Manager" | "member") => void;
  logout: () => void;
}
```

- `login()` saves to localStorage AND updates context state
- `logout()` clears localStorage AND resets context state
- On app load, context initialises from localStorage (so refresh does not log the user out)
- Page components read from `useAuth()` hook (exported from the context file)

---

## 8. Route Protection (`components/ProtectedRoute.tsx`)

Wrap authenticated pages in a `ProtectedRoute` component:

```ts
// Redirect to '/' if not authenticated
// Redirect Manager user away from member routes and vice versa
```

Route structure in `routes.tsx`:

```
/ → PortalSelection (public)
/Manager/signup → ManagerSignup (public)
/Manager/login → ManagerLogin (public)
/Manager/* → ProtectedRoute (type='Manager') → ManagerLayout → page
/members/register → MemberRegister (public)
/members/login → MemberLogin (public)
/members/* → ProtectedRoute (type='member') → page
```

---

## 9. React Query Setup (`main.tsx`)

Wrap the app in `QueryClientProvider`:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30s — avoid re-fetching on every tab focus
    },
  },
});
```

Rules:

- Use `useQuery` for all GET requests (dashboard, lists, single items)
- Use `useMutation` for all POST/PATCH/DELETE requests (login, generate invoice, add child, etc.)
- Always destructure `{ data, isLoading, isError, error }` from query/mutation
- On mutation success: call `queryClient.invalidateQueries` to refresh affected lists

---

## 10. Toast Notifications (`sonner`)

`sonner` is already installed. The `<Toaster />` component must be placed once in `App.tsx`.

Usage pattern:

```ts
import { toast } from "sonner";

toast.success("Invoice generated successfully");
toast.error("Failed to generate invoice. Please try again.");
```

Rules:

- Show a **success toast** on mutation success
- Show an **error toast** on mutation failure — use `error.response?.data?.error?.message ?? 'Something went wrong'`
- Do **not** show a loading toast — use loading icons/button disabled states instead (see Section 14)
- Never use `alert()` or `console.log` for user feedback

---

## 11. Forms (`react-hook-form`)

`react-hook-form` is already installed. All forms must use it.

```ts
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm();
```

Rules:

- Use `register` for all inputs
- Show inline validation errors from the `errors` object
- Disable the submit button and show a spinner while `isSubmitting` or mutation `isPending` is true
- On form submission, call a `useMutation` hook — not a direct API function

---

## 12. API Call Patterns

### GET — read data

```ts
// hooks/useInvoices.ts
export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceApi.getInvoices(),
  });
}
```

### POST/PATCH — mutate data

```ts
// hooks/useInvoices.ts
export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateInvoiceDto) => invoiceApi.generateInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice generated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
```

### Error message helper

```ts
// api/axiosInstance.ts — export this helper
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? "Something went wrong";
  }
  return "Something went wrong";
}
```

---

## 13. API-to-Page Mapping

| Page              | API Endpoints Used                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ManagerSignup     | POST /api/Managers/signup                                                                                                                             |
| ManagerLogin      | POST /api/Managers/login                                                                                                                              |
| ManagerDashboard  | GET /api/Managers/Manager-wallet, GET /api/Managers/summary                                                                                           |
| StudentManagement | GET /api/Managers/students                                                                                                                            |
| InvoiceManagement | GET /api/Managers/invoices, GET /api/Managers/invoices/summary, POST /api/Managers/invoices/generate, PATCH /api/Managers/invoices/toggle-paid-status |
| Transactions      | GET /api/Managers/wallet/history                                                                                                                      |
| WithdrawFunds     | _(No API — endpoint deferred. Page stays as mock UI.)_                                                                                                |
| Settings          | _(No API — stays as local state for MVP.)_                                                                                                            |
| MemberRegister    | POST /api/members/register                                                                                                                            |
| MemberLogin       | POST /api/members/login                                                                                                                               |
| MemberDashboard   | GET /api/members/student, POST /api/members/student/add                                                                                               |
| ChildDetails      | GET /api/members/student/:studentId                                                                                                                   |

---

## 14. Loading States

- All pages/sections fetching data must show a **skeleton** or **spinner** while `isLoading` is true
- Use the existing Shadcn `<Skeleton />` component for list/table placeholders
- Action buttons (Submit, Generate Invoice, Add Child, etc.) must show a loading spinner and be **disabled** while the mutation `isPending` is true
- Never show empty content without a loading indicator while data is being fetched

---

## 15. Naming Conventions

| Type                  | Convention                         | Example                              |
| --------------------- | ---------------------------------- | ------------------------------------ |
| Component files       | PascalCase                         | `InvoiceManagement.tsx`              |
| Non-component files   | camelCase                          | `axiosInstance.ts`, `useInvoices.ts` |
| Variables / functions | camelCase                          | `generateInvoice`, `isLoading`       |
| Interfaces / types    | PascalCase                         | `GenerateInvoiceDto`, `Invoice`      |
| Query keys            | kebab-case strings in array        | `['invoices']`, `['Manager-wallet']` |
| Env vars              | UPPER*SNAKE_CASE with VITE* prefix | `VITE_API_BASE_URL`                  |

---

## 16. General AI Rules

When generating code:

- Follow the architecture above — hooks call API functions, pages call hooks
- Never call axios directly in a page component
- Never hardcode API URLs — all calls go through the axios instance which reads `VITE_API_BASE_URL`
- Reuse existing Shadcn UI components from `src/app/components/ui/`
- Reuse existing Tailwind colour tokens already in the codebase
- Do not modify files in `src/app/components/ui/` — these are generated Shadcn components
- Do not add new CSS files — use Tailwind utility classes only
- Keep page components focused on layout and UX — all API logic belongs in hooks

---

## 17. What's Deferred (MVP Scope)

---

## 18. Verification Checklist

Before declaring any integration task done:

1. `npm run build` in `/client` → zero TypeScript/build errors
2. Loading skeletons/spinners are visible when the API is slow (check with network throttling)
3. Success and error toasts shown for all mutations
4. JWT token persists across page refresh (stored in localStorage, context re-initialises from it)
5. Unauthenticated user redirected to `/` when accessing a protected route
6. Correct base URL used per environment (verify in the browser Network tab)
