package db

import (
	"database/sql"
	"log"
	"questlines/models"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitDB initializes SQLite db connection and creates tables
func InitDB(datasrc string) error {
	var err error
	DB, err = sql.Open("sqlite3", datasrc)

	if err != nil {
		return err
	}
	if err = DB.Ping(); err != nil {
		return err
	}

	// enable foreign keys
	_, err = DB.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		log.Printf("Failed to enable foreign keys: %v", err)
		return err
	}

	// TODO: move to schema.sql?
	createSQL := `
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
	`
	if _, err := DB.Exec(createSQL); err != nil {
		return err
	}
	log.Println("Database initialized")

	return nil
}

// GetQuestlineInfos fetches list of all questlines
func GetQuestlineInfos() ([]models.QuestlineInfo, error) {
	rows, err := DB.Query("SELECT id, name, updated FROM questlines ORDER BY updated DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	infos := make([]models.QuestlineInfo, 0)
	for rows.Next() {
		var info models.QuestlineInfo

		if err := rows.Scan(&info.Id, &info.Name, &info.Updated); err != nil {
			return nil, err
		}
		infos = append(infos, info)
	}
	return infos, nil
}

// GetQuestline fetches single questline with all data
func GetQuestline(id string) (*models.Questline, error) {
	var questline models.Questline

	// fetch questline
	err := DB.QueryRow("SELECT id, name, created, updated FROM questlines WHERE id=?", id).Scan(
		&questline.Id, &questline.Name, &questline.Created, &questline.Updated,
	)
	if err != nil {
		return nil, err
	}

	// fetch quests of questline
	questRows, err := DB.Query("SELECT id, title, description, pos_x, pos_y, color FROM quests WHERE questline_id=?", id)
	if err != nil {
		return nil, err
	}
	defer questRows.Close()

	questline.Quests = make([]models.Quest, 0)
	for questRows.Next() {
		var quest models.Quest
		if err := questRows.Scan(&quest.Id, &quest.Title, &quest.Description, &quest.Position.X, &quest.Position.Y, &quest.Color); err != nil {
			return nil, err
		}
		questline.Quests = append(questline.Quests, quest)
	}

	// fetch dependencies in questline
	depRows, err := DB.Query("SELECT from_id, to_id FROM dependencies WHERE questline_id=?", id)
	if err != nil {
		return nil, err
	}
	defer depRows.Close()

	questline.Dependencies = make([]models.Dependency, 0)
	for depRows.Next() {
		var d models.Dependency
		if err := depRows.Scan(&d.From, &d.To); err != nil {
			return nil, err
		}
		questline.Dependencies = append(questline.Dependencies, d)
	}

	return &questline, nil
}

// saveQuestline saves a questline
func saveQuestline(tx *sql.Tx, questline *models.Questline, isUpdate bool) error {
	now := time.Now()

	if isUpdate {
		_, err := tx.Exec("UPDATE questlines SET name=?, updated=? WHERE id=?", questline.Name, now, questline.Id)
		if err != nil {
			return err
		}

		// clear old quests and dependencies
		_, err = tx.Exec("DELETE FROM quests WHERE questline_id=?", questline.Id)
		if err != nil {
			return err
		}
		_, err = tx.Exec("DELETE FROM dependencies WHERE questline_id=?", questline.Id)
		if err != nil {
			return err
		}
	} else {
		_, err := tx.Exec("INSERT INTO questlines (id, name, created, updated) VALUES (?,?,?,?)", questline.Id, questline.Name, now, now)
		if err != nil {
			return err
		}
	}

	// insert quests
	questStmt, err := tx.Prepare("INSERT INTO quests (id, questline_id, title, description, pos_x, pos_y, color) VALUES (?,?,?,?,?,?,?)")
	if err != nil {
		return err
	}
	defer questStmt.Close()

	for _, q := range questline.Quests {
		_, err := questStmt.Exec(q.Id, questline.Id, q.Title, q.Description, q.Position.X, q.Position.Y, q.Color)
		if err != nil {
			return err
		}
	}

	// insert dependencies
	depStmt, err := tx.Prepare("INSERT INTO dependencies (questline_id, from_id, to_id) VALUES (?,?,?)")
	if err != nil {
		return err
	}
	defer depStmt.Close()

	for _, d := range questline.Dependencies {
		_, err := depStmt.Exec(questline.Id, d.From, d.To)
		if err != nil {
			return err
		}
	}
	return nil
}

// CreateQuestline creates new questline
func CreateQuestline(ql *models.Questline) (*models.Questline, error) {
	ql.Id = uuid.New().String()

	tx, err := DB.Begin()
	if err != nil {
		return nil, err
	}
	if err := saveQuestline(tx, ql, false); err != nil {
		tx.Rollback()
		return nil, err
	}
	tx.Commit()
	return GetQuestline(ql.Id)
}

// UpdateQuestline updates existing questline
func UpdateQuestline(ql *models.Questline) (*models.Questline, error) {
	tx, err := DB.Begin()
	if err != nil {
		return nil, err
	}
	if err := saveQuestline(tx, ql, true); err != nil {
		tx.Rollback()
		return nil, err
	}
	tx.Commit()
	return GetQuestline(ql.Id)
}

// DeleteQuestline deletes questline
func DeleteQuestline(id string) error {
	_, err := DB.Exec("DELETE FROM questlines WHERE id=?", id)
	return err
}
