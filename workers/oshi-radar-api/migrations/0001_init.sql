-- 推し活レーダーOS D1 初期スキーマ
-- Phase 1 の localStorage 構造を正規化しつつ、Phase 2b（自動収集）を前提に
-- event_change_logs / source_registry / event_scores / notifications を先に用意する。

-- マルチユーザー化前提。Phase 2a は単一ユーザー 'u_main' で運用する。
CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE oshi (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  name       TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT '',
  priority   INTEGER NOT NULL DEFAULT 2,     -- 1=最推し 2=高 3=通常
  notify     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_oshi_user ON oshi(user_id);

-- 関連キーワード・表記揺れ・除外語（kind: related / exclude）
CREATE TABLE oshi_keywords (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  oshi_id TEXT NOT NULL REFERENCES oshi(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  kind    TEXT NOT NULL DEFAULT 'related' CHECK (kind IN ('related', 'exclude'))
);
CREATE INDEX idx_oshi_keywords_oshi ON oshi_keywords(oshi_id);

CREATE TABLE events (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES users(id),
  name                  TEXT NOT NULL,
  organizer             TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL DEFAULT '',
  prefecture            TEXT NOT NULL DEFAULT '',
  city                  TEXT NOT NULL DEFAULT '',
  venue                 TEXT NOT NULL DEFAULT '',
  area                  TEXT NOT NULL DEFAULT '',
  start_date            TEXT NOT NULL DEFAULT '',
  end_date              TEXT NOT NULL DEFAULT '',
  open_time             TEXT NOT NULL DEFAULT '',
  close_time            TEXT NOT NULL DEFAULT '',
  last_entry            TEXT NOT NULL DEFAULT '',
  fee                   TEXT NOT NULL DEFAULT '',
  needs_reservation     INTEGER NOT NULL DEFAULT 0,
  needs_numbered_ticket INTEGER NOT NULL DEFAULT 0,
  same_day_ticket       INTEGER NOT NULL DEFAULT 0,
  free_entry            INTEGER NOT NULL DEFAULT 0,
  free_entry_from       TEXT NOT NULL DEFAULT '',
  official_url          TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT '開催中',
  notes                 TEXT NOT NULL DEFAULT '',
  -- 公式ソース(L1/L2)が1つ以上あれば 'verified'、なければ 'unverified'【要確認】
  verification          TEXT NOT NULL DEFAULT 'unverified' CHECK (verification IN ('verified', 'unverified')),
  -- ユーザーが手動編集したフィールド名のJSON配列。収集エンジンはここにある項目を上書きできない
  manual_fields         TEXT NOT NULL DEFAULT '[]',
  -- 誤認防止: norm(名前)|norm(会場)|開始日|norm(主催者)。ユーザー内で一意
  identity_key          TEXT NOT NULL,
  created_by            TEXT NOT NULL DEFAULT 'user',  -- user / collector / migration
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  last_verified_at      TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX idx_events_identity ON events(user_id, identity_key);
CREATE INDEX idx_events_user_dates ON events(user_id, end_date);

CREATE TABLE event_sources (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  official     INTEGER NOT NULL DEFAULT 0,
  -- L1=主催者公式 / L2=準公式(主催者発プレスリリース) / L3=未確認(アグリゲータ・検索)
  source_level TEXT NOT NULL DEFAULT 'L3' CHECK (source_level IN ('L1', 'L2', 'L3')),
  fetched_at   TEXT NOT NULL DEFAULT '',
  verified_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_event_sources_event ON event_sources(event_id);

-- 推しとイベントの紐付け（match_type: 本人/グループ/コラボ/関連作品）
CREATE TABLE event_oshi_links (
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  oshi_id    TEXT NOT NULL REFERENCES oshi(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL,
  PRIMARY KEY (event_id, oshi_id)
);

CREATE TABLE schedules (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date    TEXT NOT NULL
);
CREATE INDEX idx_schedules_user_date ON schedules(user_id, date);

CREATE TABLE schedule_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  time        TEXT NOT NULL DEFAULT '',
  end_time    TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL DEFAULT '',
  area        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_schedule_items_schedule ON schedule_items(schedule_id);

CREATE TABLE settings (
  user_id          TEXT PRIMARY KEY REFERENCES users(id),
  home_area        TEXT NOT NULL DEFAULT '津',
  search_range_min INTEGER NOT NULL DEFAULT 30,
  default_stay_min INTEGER NOT NULL DEFAULT 30,
  updated_at       TEXT NOT NULL
);

-- 更新履歴。「開催時間が変わった」等の変更検知・通知(Phase 2b)の元データ
CREATE TABLE event_change_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      TEXT NOT NULL,
  field         TEXT NOT NULL,
  old_value     TEXT NOT NULL DEFAULT '',
  new_value     TEXT NOT NULL DEFAULT '',
  -- 上書き優先順位の判定に使う: user > collector_L1 > collector_L2 > collector_L3
  change_source TEXT NOT NULL DEFAULT 'user',
  changed_at    TEXT NOT NULL
);
CREATE INDEX idx_change_logs_event ON event_change_logs(event_id, changed_at);

-- ---- 以下は Phase 2b で使う受け皿（2aでは書き込まない） ----

-- スコアのスナップショット。通知判定の重複抑止・「新たに80点を超えた」検知に使う
CREATE TABLE event_scores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  event_id    TEXT NOT NULL,
  score_total INTEGER NOT NULL,
  breakdown   TEXT NOT NULL DEFAULT '{}',
  computed_at TEXT NOT NULL
);
CREATE INDEX idx_event_scores_user ON event_scores(user_id, event_id);

CREATE TABLE notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  event_id   TEXT NOT NULL DEFAULT '',
  level      TEXT NOT NULL DEFAULT '',   -- must / warn / reco / near
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  sent_at    TEXT NOT NULL DEFAULT '',
  read_at    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);

-- 収集ソースの管理（管理画面から追加削除する対象）
CREATE TABLE source_registry (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  source_level    TEXT NOT NULL DEFAULT 'L1' CHECK (source_level IN ('L1', 'L2', 'L3')),
  fetch_method    TEXT NOT NULL DEFAULT 'html',  -- html / rss / search
  enabled         INTEGER NOT NULL DEFAULT 1,
  schedule_hint   TEXT NOT NULL DEFAULT 'daily', -- daily / trip_boost 等、tickスケジューラへのヒント
  last_fetched_at TEXT NOT NULL DEFAULT '',
  last_hash       TEXT NOT NULL DEFAULT '',      -- 差分検知用コンテンツハッシュ
  notes           TEXT NOT NULL DEFAULT ''
);

-- 単一ユーザーのシード
INSERT INTO users (id, name, email, created_at)
VALUES ('u_main', 'main', '', '2026-08-19T00:00:00.000Z');
INSERT INTO settings (user_id, home_area, search_range_min, default_stay_min, updated_at)
VALUES ('u_main', '津', 30, 30, '2026-08-19T00:00:00.000Z');
