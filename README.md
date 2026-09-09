# tutor-platform

This is a from-scratch rebuild, assembled cube by cube from the original
sketches. Built so far:

- **Shared login** (`/login`) — one email field for both teachers and
  students; the server looks the email up in `Teacher` and `Student`
  and sends the right magic link (real SMTP delivery via `lib/mailer.ts`,
  see the `SMTP_*` vars below — falls back to logging the link to the
  console if they're unset). Unknown emails get a 404, nothing
  is created.
- **Teacher registration** (`/register`) — name + email + a secret
  `TEACHER_SIGNUP_CODE` handed out personally to legitimate new
  teachers. This is the *only* way a Teacher row can be created from
  the public app.
- **Check email screen** (`/login/check-email`)
- **Magic-link verification** (`/api/auth/verify`) — validates the token,
  then redirects to `/dashboard/teacher` (success) or back to `/login`
  (error/expired)
- **Teacher dashboard shell** (`/dashboard/teacher`) — header, three tabs
  (START | ტესტები | ჯგუფები)
- **START tab** — now wired to real data: pick a group, pick a
  *published* test (labeled `თემა · type 1 · სათაური` so it's never
  ambiguous which one you're sending), send. Creates a `SentTest` that
  immediately appears on every student in that group's dashboard.
- **Student dashboard** (`/dashboard/student`) — "ახალი ტესტები"
  (pending sent tests for the student's group they haven't attempted
  yet) and "უკვე გაკეთებული ტესტები" (a table: ტესტი / თარიღი /
  შედეგი / review)
- **Taking a test** (`/dashboard/student/take/[sentTestId]`) —
  instructions screen (question count, options range, 30s/question,
  single-correct-answer, confirm-to-advance) → one question at a time
  with a 30-second countdown that auto-advances on timeout → submits
  and scores server-side (never trusts a client-sent score)
- **Results** (`/dashboard/student/results/[attemptId]`) — score,
  link to the detailed review, "მთავარ გვერდზე დაბრუნება", and a 30s
  countdown that auto-returns to the dashboard
- **Review** (`.../review`) — per-question correct answer vs. the
  student's own answer, plus test/attempt/email context
- **ჯგუფები tab** (`/dashboard/teacher/groups`) — full groups/students
  management: accordion list, add/rename/delete group, add/edit/delete
  student (name, surname, contact, email — access code auto-generated),
  drag-and-drop reorder for both groups and students, n/s/c/e
  reveal-on-click fields, h → student's test history (placeholder
  until the student-dashboard cube exists)
- **ტესტები tab** (`/dashboard/teacher/tests`) — თემები & ტესტები:
  themes list (drag reorder, add/rename/delete), each theme has three
  template slots (type1/2/3 — only type1's MCQ template is built;
  type2/3 show a disabled "+" until their templates are designed),
  numbered tests (`1.1.1` = theme.type.test), a new-test editor
  (`/tests/new?themeId=…&type=…`) and an existing-test page that opens
  read-only with an `edit` button, single-correct-answer questions
  with 2–6 options, Save vs. Publish (unpublished tests show dimmed
  in the teacher's list; the student side, once built, won't show
  them at all)

Student login/dashboard are stubbed as placeholders; they're built once
we go through that cube's sketches. Students are only ever created by
an already-logged-in teacher, from the ჯგუფები tab (next cube) — there
is no public student sign-up either.

### Security model, in short

- No route lets anyone create a `Teacher` outside `/register`, and
  `/register` requires a secret only real teachers have.
- No route lets anyone create a `Student` except an authenticated
  teacher acting inside their own dashboard (`POST /api/groups/[id]/students`).
- `/login` never creates accounts — it only sends a link for emails
  that already exist.

So a student has no path — through the UI or the API — to ever reach
a teacher's dashboard or mint themselves a teacher account.

### Session handling: NextAuth v5

`getCurrentTeacherId()` and `getCurrentStudentId()` now read a real
session via `auth()` (`lib/auth.ts`) instead of returning the first
row in their table. How a session gets created:

1. `/login` sends a magic link (unchanged).
2. `/api/auth/verify` validates the one-time token, then calls
   `signIn("internal", { email, role, internalSecret })` — the
   `internal` Credentials provider in `lib/auth.ts` only issues a
   session if `internalSecret` matches `INTERNAL_AUTH_SECRET`, an
   env var that never reaches the client. This is what stops someone
   from POSTing straight to `/api/auth/callback/credentials` and
   minting a session for any email without ever receiving a link —
   the provider isn't a public sign-in form, it's a trusted handoff
   from our own token check.
3. `proxy.ts` (Next.js 16's replacement for `middleware.js`) protects
   every `/dashboard/teacher/*` and `/dashboard/student/*` route:
   no session → redirected to `/login`; wrong-role session (e.g. a
   student hitting a teacher URL) → also redirected to `/login`.

Every API route was already written against `getCurrentTeacherId()` /
`getCurrentStudentId()`, so nothing else needed to change — this was
the one place the whole app was designed to swap in real auth.

Students never get a log-out control, by design (Image 6 of the
login cube: once in, they stay in). Teacher log-out isn't built yet
either — not asked for so far.

## Running locally

```bash
npm install --legacy-peer-deps   # next-auth@5 beta hasn't listed Next 16
                                   # in its peer range yet; harmless here
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
                        # INTERNAL_AUTH_SECRET, TEACHER_SIGNUP_CODE,
                        # SEED_TEACHER_EMAIL/NAME, SMTP_* (optional — omit
                        # to just log magic links to the console instead)
npx prisma migrate dev --name init
npx prisma db seed     # creates Natia's teacher account
npm run dev
```

Before deploying, double-check `next` is on a current patched
version — `npm outdated next`. Next.js shipped several security
releases through 2026; whatever version is pinned in `package.json`
by the time you read this may already be behind.

## What's intentionally left for later

- Test templates `type2`/`type3` — only `type1` (MCQ) has a template
  designed so far.
- Teacher log-out isn't built (students never get one, by design).
- The hamburger menu icon in both dashboards is decorative — no
  drawer behind it yet.

## Deploying: GitHub → Vercel

1. **Push to GitHub.** From the project root:
   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   git branch -M main
   git remote add origin <your-empty-github-repo-url>
   git push -u origin main
   ```
   `.gitignore` already excludes `node_modules/`, `.next/`, and `.env`.

2. **Database: Neon Postgres.** Create a project at neon.tech, copy
   the pooled connection string it gives you — that's `DATABASE_URL`.

3. **Import the repo into Vercel** (vercel.com → Add New → Project →
   pick the GitHub repo). Vercel auto-detects Next.js; no build
   command changes needed. `package.json`'s `postinstall` already
   runs `prisma generate` automatically on every install.

4. **Set environment variables** in the Vercel project settings
   (Settings → Environment Variables) — everything in `.env.example`:
   - `DATABASE_URL` — from Neon
   - `NEXTAUTH_SECRET` / `INTERNAL_AUTH_SECRET` — two *different*
     long random strings (`openssl rand -base64 32` each)
   - `NEXTAUTH_URL` — your Vercel deployment URL, e.g.
     `https://your-project.vercel.app` (update this once Vercel
     assigns the final domain)
   - `TEACHER_SIGNUP_CODE` — a code you'll hand to any new teacher
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` /
     `SMTP_FROM` — real values, or magic links just log to Vercel's
     function logs instead of emailing (fine for testing, not for
     Natia's actual students)
   - `SEED_TEACHER_EMAIL` / `SEED_TEACHER_NAME` — only needed for the
     one-time seed step below, not required at runtime

5. **Run the migration + seed against the Neon database** — this
   needs your local machine (Vercel doesn't run one-off commands):
   ```bash
   cp .env.example .env   # paste in the real DATABASE_URL etc.
   npx prisma migrate deploy
   npx prisma db seed
   ```

6. **Deploy.** Vercel builds automatically on push; trigger the first
   one from the dashboard if it hasn't already. Once live, test the
   full loop: `/register` a teacher (or log in as the seeded one),
   add a group/student, create + publish a test, send it, log in as
   that student, take it, check the result.

7. Re-check `npm outdated next` right before this step — see the
   note above about Next.js's 2026 security releases.
