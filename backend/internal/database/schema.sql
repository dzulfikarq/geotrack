CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  legacy_key TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 60),
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'truck' CHECK (icon IN ('truck', 'cpu', 'building-2', 'package', 'radio', 'map-pin')),
  icon_key TEXT NOT NULL DEFAULT 'truck' CHECK (icon_key IN (
    'truck', 'car-front', 'bus-front', 'bike', 'ship', 'train-front',
    'cpu', 'radio', 'router', 'wifi', 'satellite-dish', 'thermometer',
    'building-2', 'warehouse', 'factory', 'hospital', 'school', 'landmark',
    'map-pin', 'map-pinned', 'package', 'box', 'briefcase', 'database'
  )),
  color TEXT NOT NULL CHECK (color IN ('orange', 'teal', 'violet', 'blue', 'green', 'rose', 'slate', 'amber')),
  marker_style TEXT NOT NULL DEFAULT 'pin' CHECK (marker_style IN ('pin', 'circle', 'rounded-square')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
