# Kovana Natural Farm — Backend Architecture (Design)

Status: **design / proposed** · No code yet · Owner: Gagan

## 1. Goals & principles

The backend exists to hold **all business logic and authorization** for the farm
app, with the database used purely as storage. Design principles:

- **Separation of concerns.** HTTP handling, business logic, and data access are
  distinct layers. Each does one job.
- **Logic in the application, not the database.** No stored procedures, no
  triggers, no business rules in SQL. The DB stores data and protects its
  *integrity* (constraints) — nothing more.
- **Scalable to more features.** Adding "harvests", "roles", or a public API is a
  new module, not a rewrite.
- **Testable.** Business logic runs without a database or a web server, so it can
  be unit-tested in isolation.
- **Portable.** Swapping the Postgres host (Supabase → AWS RDS) touches only the
  data layer, never the logic.
- **Secure by default.** Verify every request, validate every input, never trust
  the browser.

## 2. High-level shape

```
Browser (static site)  ──login──▶  Supabase Auth (Google OAuth) ──JWT──▶ Browser
Browser  ──API call + JWT──▶  Backend API (Node/TS)  ──SQL──▶  PostgreSQL
```

- **Supabase Auth** is used ONLY to log the user in with Google and issue a
  signed identity token (JWT). This is deliberate: OAuth token exchange, key
  rotation and session refresh are a solved commodity — rebuilding them would be
  a mistake. It is *authentication plumbing*, not business logic.
- The **backend** verifies that token on every request and owns everything else.
- The **database** only stores rows.

## 3. Recommended stack

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type safety scales with features and contributors |
| HTTP framework | **Fastify** (Express is the fallback) | Fast, modern, first-class TS, schema-based validation |
| Data access / ORM | **Prisma** | Schema-as-code + versioned migrations, type-safe queries, keeps SQL out of business code. (Kysely or raw `pg` are lighter alternatives.) |
| Input validation | **zod** | Validate at the boundary; reject bad input before logic runs |
| JWT verification | **jose** | Verify Supabase JWTs against their public keys (JWKS) |
| Logging | **pino** | Structured, fast logs |
| Testing | **Vitest** | Unit-test services with mocked repositories |
| Packaging | **Docker** | Portable image; run anywhere |

Deployment target is an open decision — see §9.

## 4. Layered architecture & the dependency rule

Three layers inside the backend. **Dependencies point downward only:** a
controller may call a service; a service may call a repository; never the reverse,
and layers never skip.

1. **HTTP layer — routes, controllers, middleware.**
   Parses the request, runs auth middleware (verify JWT → attach `req.user`),
   validates input with zod, calls a service, formats the response. Contains
   **no business logic** and no SQL.

2. **Service layer — all business logic.**
   The heart of the system. Example: `recordLogin(userId, email, meta)` decides
   "update the profile summary, then append a login event." Knows nothing about
   HTTP or SQL, so it is fully unit-testable.

3. **Repository layer — data access only.**
   The single place that knows the database exists. Exposes plain operations
   (`profiles.upsert(...)`, `loginEvents.create(...)`). Contains no business
   rules.

Below these sits **PostgreSQL**, holding plain tables plus integrity constraints
(foreign keys, NOT NULL, unique, indexes). No procedures, no triggers.

## 5. Folder structure (modular by feature)

```
backend/
  src/
    config/            # env loading, typed config
    lib/               # db client, logger, jwt verifier
    middleware/        # auth (verify JWT), error handler, request logging
    modules/
      auth/            # login recording (current milestone)
        auth.routes.ts
        auth.controller.ts
        auth.service.ts
        auth.repository.ts
        auth.types.ts
      harvests/        # FUTURE — same shape, added independently
      users/           # FUTURE — roles / authZ
    app.ts             # assemble the app (register modules, middleware)
    server.ts          # start the server
  prisma/
    schema.prisma      # data model as code
    migrations/        # versioned schema history
  tests/
  .env.example
  package.json
  tsconfig.json
  Dockerfile
```

Adding a feature = adding a folder under `modules/`. Nothing else changes.

## 6. Request lifecycle — recording a login

1. Browser signs in with Google via Supabase → receives a JWT.
2. Browser calls `POST /v1/auth/login-event` with `Authorization: Bearer <jwt>`.
3. **Auth middleware** verifies the JWT signature against Supabase's public keys,
   extracts the user id + email, attaches them to the request. Invalid/expired →
   `401`, request stops here.
4. **Controller** validates the (small) body with zod, calls the service.
5. **Service** `recordLogin()` runs the business rule: upsert the user's profile
   summary (first-seen, last-login, count) and append a `login_events` row.
6. **Repository** performs the two writes via Prisma (parameterized).
7. Response `204 No Content`.

`GET /v1/auth/me` follows the same path to return the current profile + recent
logins for the account page.

## 7. Data model (plain tables — no logic)

**profiles** — one row per person who has logged in.

| column | type | notes |
|---|---|---|
| id | uuid PK | equals the Supabase auth user id |
| email | text | |
| full_name | text | |
| avatar_url | text | |
| created_at | timestamptz not null default now() | first seen |
| last_login_at | timestamptz | maintained by the service |
| login_count | integer not null default 0 | maintained by the service |

**login_events** — one row per login (the audit trail / "recent logins").

| column | type | notes |
|---|---|---|
| id | bigint PK | |
| user_id | uuid FK → profiles.id | |
| email | text | |
| logged_in_at | timestamptz not null default now() | |
| user_agent | text | |

Index: `login_events(user_id, logged_in_at desc)`.
Constraints (FK, NOT NULL, defaults) stay in the DB — that is data integrity,
not business logic. **No triggers, no functions.** The `last_login_at` /
`login_count` updates that were previously a DB function now live in the service.

> **Multi-tenancy note:** farm-owned tables (harvests, crops, and future ones)
> also carry a `farm_id`, and users relate to farms through `farm_memberships`.
> See §12 for the product-ready design.

## 8. Authentication & authorization

- **Authentication (now):** Supabase issues the Google JWT; the backend verifies
  it in middleware. Stateless — no server-side sessions.
- **Authorization (later, cleanly added):** when roles arrive, a `role` column on
  `profiles` (or a `user_roles` table) is **read by the app**, and enforced in the
  app: a `requireRole('admin')` middleware for coarse checks, and explicit checks
  inside services for fine-grained rules. No database-side policy engine — the
  decision stays in code, consistent with the "logic in the app" principle.

## 9. Scaling & operational concerns

- **Stateless services** → run multiple instances behind a load balancer; JWT
  verification needs no shared session store.
- **API versioning** (`/v1`) → evolve endpoints without breaking clients.
- **Connection pooling** (PgBouncer / Supabase pooler) for many concurrent
  connections.
- **Caching** the public Harvest Meter read (e.g. short-TTL cache / CDN) so public
  traffic never hammers the DB.
- **Background jobs** (later) for things like digests, kept off the request path.
- **Deployment options (open):** a container on Render / Railway / Fly.io
  (simple, low cost) now; AWS ECS/Fargate later if scale demands. Same Docker
  image throughout.
- **Environments:** dev / staging / prod, each with its own DB and env vars;
  schema changes ship as Prisma migrations through CI.

## 10. Security checklist

- Verify JWT on every protected route; never trust client-sent identity.
- Validate and normalize all input at the boundary (zod).
- Parameterized queries only (Prisma) — no string-built SQL.
- Least-privilege database credentials held only by the backend (never in the
  browser). The `service_role`/admin key never ships to the client.
- Secrets in environment variables (12-factor), not in code.
- CORS locked to the site's origin; rate limiting on public endpoints.
- The database is not publicly reachable; the backend is its only client.

## 11. What changed from the earlier (backend-less) sketch

The first draft had the browser talking straight to Supabase, which forced logic
into the database (`record_login()`, the `handle_new_user` trigger) because there
was no application tier to trust. Introducing this backend tier removes that
constraint: **those procedures become service-layer code, and the database goes
back to being plain storage.** The earlier `supabase/*.sql` files are superseded
by the Prisma schema described here.

## 12. Multi-tenancy — product-ready, not over-built

Decision: **build for Kovana now, but never assume only one farm exists.** The
data belongs to a *farm*, so tenancy lives in the model from day one — but the
"product" machinery (onboarding, billing, invitations) is deliberately deferred.

**What we add now (cheap):**

- A **`farms`** table is the tenant root: `id`, `name`, `slug`, `timezone`,
  `created_at`. Seed a single row for Kovana.
- Every farm-owned table (`harvests`, `crops`, and future ones) carries a
  **`farm_id`** foreign key → `farms.id`.
- A **`farm_memberships`** table (`user_id`, `farm_id`, `role`) links people to
  farms. This is *also* the future home of per-farm roles when authZ arrives.
  For now it holds one row: you → Kovana.
- **Tenant scoping is enforced in the service/repository layer** — every data
  query is filtered by the caller's `farm_id` (derived from their membership),
  so one farm can never read another's data. Application-layer enforcement,
  consistent with "logic in the app."

**What we deliberately do NOT build now:**

- Farm signup / onboarding flow, billing, per-farm settings UI, member
  invitations. That is the *product* layer — added only if and when we
  productize, and it slots on top without touching the core.

**Why now and not later:** adding a `farm_id` column and a scoping helper today
costs almost nothing; retrofitting tenancy into a single-tenant schema later
means touching every table, query, and migration. This is cheap insurance that
keeps the "release to other farms" door open at near-zero present cost.

`profiles` stays a global identity record (one per person); which farm(s) a
person belongs to — and their role there — is expressed through
`farm_memberships`, not baked into the profile.
