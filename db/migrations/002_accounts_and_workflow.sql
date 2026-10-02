ALTER TABLE "User" ADD COLUMN password_hash TEXT;
ALTER TABLE "User" ADD COLUMN recovery_hash TEXT;
ALTER TABLE "User" ADD COLUMN role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin'));
ALTER TABLE "User" ADD COLUMN focus TEXT NOT NULL DEFAULT 'Сон и энергия';
ALTER TABLE "User" ADD COLUMN answers JSONB NOT NULL DEFAULT '["","",""]';
ALTER TABLE "User" ADD COLUMN scores JSONB NOT NULL DEFAULT '[null,null,null,null,null,null,null,null,null,null,null,null]';
ALTER TABLE "User" ADD COLUMN goal TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN onboarded BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN paused BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN consent_version TEXT;
ALTER TABLE "User" ADD COLUMN consent_at TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX users_email_normalized ON "User" (lower(email));
ALTER TABLE "Assessment" ADD CONSTRAINT assessment_score_range CHECK (score BETWEEN 0 AND 10);
ALTER TABLE "TaskInstance" ADD COLUMN title TEXT;
ALTER TABLE "TaskInstance" ADD COLUMN sphere TEXT;
ALTER TABLE "TaskInstance" ADD COLUMN variants JSONB;
ALTER TABLE "TaskInstance" ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Almaty';
ALTER TABLE "TaskInstance" ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "TaskInstance" ADD CONSTRAINT task_variant CHECK (variant IN ('minimum','normal','expanded'));
CREATE UNIQUE INDEX task_daily_slot ON "TaskInstance"("userId", "localDate") WHERE status <> 'REPLACED';
CREATE UNIQUE INDEX report_per_task ON "TaskReport"("taskId");
CREATE TABLE report_revisions (
  id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES "TaskInstance"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  result TEXT NOT NULL, note TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE monthly_snapshots (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  scores JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE request_keys (
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  key TEXT NOT NULL, fingerprint TEXT NOT NULL, response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id,key)
);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at TIMESTAMPTZ NOT NULL);
CREATE TABLE telegram_links (
  user_id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  telegram_id TEXT UNIQUE NOT NULL, linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE telegram_link_requests (
  user_id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  candidate_id TEXT, candidate_name TEXT
);
CREATE TABLE telegram_updates (update_id BIGINT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY, actor_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
