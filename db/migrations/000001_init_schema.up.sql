-- initialize schema

CREATE TABLE IF NOT EXISTS questlines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    questline_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pos_x REAL DEFAULT 0,
    pos_y REAL DEFAULT 0,
    color TEXT,
    FOREIGN KEY (questline_id) REFERENCES questlines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dependencies (
    questline_id TEXT NOT NULL,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    PRIMARY KEY (questline_id, from_id, to_id),
    FOREIGN KEY (questline_id) REFERENCES questlines(id) ON DELETE CASCADE,
    FOREIGN KEY (from_id) REFERENCES quests(id) ON DELETE CASCADE,
    FOREIGN KEY (to_id) REFERENCES quests(id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS update_questline_modtime
AFTER UPDATE ON questlines
FOR EACH ROW
BEGIN
    UPDATE questlines SET updated=CURRENT_TIMESTAMP WHERE id=OLD.id;
END;
