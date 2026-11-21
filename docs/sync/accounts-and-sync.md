# Accounts and cloud sync: plan

Status: proposal plus a working client-side prototype. No hosted provider is chosen yet.

## Where we are today

Every piece of learner data lives only in the browser's (or Android WebView's) `localStorage`:

| Key | What it holds | Written by |
| --- | --- | --- |
| `simlit_profile` | name, age, university, hobbies, field/subfield | `App.jsx` onboarding and profile edits |
| `simlit_notes_list` | array of notes `{ id, title, content, date }` | `MyNotesPage.jsx` |
| `simlit_law_case_progress` | `{ caseId: percent }` | `LawCasesSimulation`, `LawCourtroomSimulation` |
| `simlit_health_case_progress` | `{ caseId: percent }` | `HealthCasesSimulation`, `HealthClinicalRoomSimulation` |
| `simlit_law_courtroom_attempts` | `{ caseId: { bestScore, attempts } }` | `LawCourtroomSimulation` |
| `simlit_clinical_room_attempts` | `{ caseId: { bestScore, attempts } }` | `HealthClinicalRoomSimulation` |

Consequences: clearing the browser, reinstalling the APK, or switching phone loses everything, and the same learner on web and Android has two unrelated copies. "Log out" also did not clear the two attempts keys, so the next person on a shared device saw the previous learner's scores (fixed in this PR).

## Goals

1. The app keeps working fully offline, with no sign-in required. Local storage remains the copy the UI reads from.
2. Signing in is optional and backs up and syncs everything above across web and Android.
3. Data a learner already has on a device is kept and uploaded on first sign-in.
4. Edits made on two devices while offline merge sensibly, without a "pick a version" dialog.
5. The backend choice stays swappable: the app depends on a four-call provider interface, not on a vendor SDK.

## Design

### Data model: documents split into entries

Each storage key above is a *document*. Documents are split into *entries* so that unrelated edits never collide:

- `record` (profile): one entry per top-level field. Changing your university on the phone and your hobbies on the laptop both survive.
- `collection` (notes): one entry per note id.
- `map` (progress, attempts): one entry per case id.

Every entry carries a stamp `{ updatedAt, deviceId }`. On conflict the newer stamp wins; equal times break on device id so all devices agree. Deleted entries keep a tombstone so a stale copy cannot bring them back. This is last-writer-wins per entry, which is right for this data: notes are edited one at a time, and progress "reset" is a deliberate action that should win if it is newer (so a plain max-merge would be wrong).

Known limit: two devices editing *the same note* offline keep only the later edit. If that turns out to matter, the next step is per-note text merge (e.g. a CRDT such as Yjs for note bodies only), which slots in behind the same entry interface.

Known limit: stamps use the device clock. A device with a badly wrong clock can win conflicts it should lose. Mitigation, when a server exists: the server rejects stamps more than a few minutes in the future and the client switches to a hybrid logical clock seeded from server time.

### Wire format: one flat table of rows

```
userId | docKey | entryKey | value (json) | updatedAt | deviceId | deleted | seq
```

- Push: upsert rows, accepted only if the incoming stamp is newer than the stored one.
- Pull: "give me rows with `seq` greater than my cursor", paged. `seq` is a server-assigned, monotonically increasing number, so clocks never decide what a device has already seen.

Postgres sketch (works on any Postgres host, including Supabase):

```sql
create table sync_entries (
  user_id    uuid    not null,
  doc_key    text    not null,
  entry_key  text    not null,
  value      jsonb,
  updated_at bigint  not null,
  device_id  text    not null,
  deleted    boolean not null default false,
  seq        bigserial,
  primary key (user_id, doc_key, entry_key)
);
create index on sync_entries (user_id, seq);

-- push: only newer stamps win, and every accepted write gets a fresh seq
insert into sync_entries as s (user_id, doc_key, entry_key, value, updated_at, device_id, deleted)
values ($1, $2, $3, $4, $5, $6, $7)
on conflict (user_id, doc_key, entry_key) do update
  set value = excluded.value, updated_at = excluded.updated_at,
      device_id = excluded.device_id, deleted = excluded.deleted,
      seq = nextval(pg_get_serial_sequence('sync_entries', 'seq'))
  where (excluded.updated_at, excluded.device_id) > (s.updated_at, s.device_id);

-- row-level security: a user only ever sees their own rows
alter table sync_entries enable row level security;
create policy own_rows on sync_entries using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Payloads are tiny (one note or one score per row), which suits patchy mobile connections.

### Client pieces in this PR (`src/sync/`)

| File | Role |
| --- | --- |
| `docs.js` | Registry of synced keys and how each splits into entries. Adding a new kind of learner data is one line here. |
| `localStore.js` | `readDoc` / `writeDoc` used by every page instead of raw `localStorage`. Records stamps and a pending-upload set in a `simlit_sync_meta` sidecar; applies remote rows; `clearLocalData` for sign-out. |
| `merge.js` | The stamp comparison rule, pure, shareable with a server. |
| `syncEngine.js` | Background loop: push pending, pull since cursor, merge. Runs on start, 1.5 s after a local edit, when the device comes back online, every 60 s, and on an optional realtime nudge. Never blocks the UI. |
| `providers/memoryProvider.js` | In-memory backend that follows the server contract exactly. Used by tests and demos. |
| `providers/httpProvider.js` | Client for a plain `POST /sync/push`, `GET /sync/pull?cursor=` API with a bearer token. |

All pages now go through `readDoc` / `writeDoc`. With no provider configured, behaviour is unchanged apart from the sidecar bookkeeping. Tests (`npm run test:sync`) cover cross-device profile sync, two devices editing different notes, later-edit-wins on the same entry, deletes, uploading pre-existing local data, account isolation, and sign-out clearing everything.

A provider must implement:

```js
getSession()                 // -> { userId } | null
push(userId, rows)           // upsert, newer stamp wins
pull(userId, cursor)         // -> { rows, cursor, hasMore }
subscribe?(userId, onChange) // optional realtime nudge, returns unsubscribe
```

### Account flows

- **Guest (default):** exactly today's app. A small "Back up and sync" prompt on the profile hub.
- **Sign in:** email magic link or one-time code, plus Google. On Android (Capacitor) this needs an app deep link for the auth redirect; the code option avoids that entirely, which is why it should be offered.
- **First sign-in on a device with data:** if the account is empty, upload local data. If the account already has data, merge using the entry rules above (the common case: same learner, second device). If the local data clearly belongs to someone else (different profile name), ask "Keep this device's data" vs "Use your account's data".
- **Sign out:** push anything pending (with a short timeout and a warning if offline), then `clearLocalData()`.
- **Delete account:** server deletes all rows for the user; required for app-store listing and good practice since the profile holds name, age and university.

## Hosted provider: decision needed

Everything above works with any of these. The choice mostly changes how auth is done and who runs the server.

| Option | Auth | Sync API | Fit for SIMLIT |
| --- | --- | --- | --- |
| **Supabase** (recommended) | Email OTP / magic link, Google, phone; works in Capacitor | The SQL above runs as-is, with RLS; push/pull as two RPC functions or direct table calls, realtime channel for `subscribe` | Postgres means no lock-in (export and self-host any time). Generous free tier. Least custom server code. |
| Firebase (Firestore + Auth) | Strong, very mature on Android | Would map rows to Firestore documents; Firestore has its own offline cache, which overlaps with ours | Works well on Android, but data model and rules are Firestore-specific, so harder to move off later. |
| PocketBase (self-hosted) | Email, OAuth | Collection plus a small hook for the newer-stamp rule | Cheapest at scale and a single binary, but someone has to run and back up a server. |
| Own Node API + managed Postgres | Build or plug in (e.g. Auth.js) | `httpProvider.js` is already the client | Most control, most work: auth, rate limiting and ops are all ours. |

## Phases

1. **This PR:** local-first store, sync engine, provider interface, tests, all pages routed through the store, sign-out clears all learner data.
2. **After the provider is chosen:** provider adapter, sign-in UI (profile hub + onboarding), deep link setup for Android, sync status indicator ("Synced", "Offline, will sync", "Sync error").
3. **Hardening:** server clock guard / hybrid clock, account deletion, export my data, basic monitoring of sync errors.
4. **Later, if needed:** per-note text merge, sharing notes between learners, teacher/class accounts.
