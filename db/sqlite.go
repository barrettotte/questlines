package db

import (
	"database/sql"
	"embed"
	"fmt"
	"log"
	"questlines/models"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitDB initializes SQLite db connection and runs database migrations
func InitDB(dataSourceName string, migrationsDir string, embeddedMigrations embed.FS) error {
	var err error
	DB, err = sql.Open("sqlite3", dataSourceName)

	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// enable foreign keys
	_, err = DB.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		return fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	applyMigrations(migrationsDir, embeddedMigrations)

	// verify db instance is still up
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database after applying migrations: %w", err)
	}

	log.Println("Database initialized")

	return nil
}

// applies database migrations
func applyMigrations(migrationsDir string, embeddedMigrations embed.FS) {
	driver, err := sqlite3.WithInstance(DB, &sqlite3.Config{})
	if err != nil {
		log.Fatalf("Migration driver error: %v", err)
	}

	srcDriver, err := iofs.New(embeddedMigrations, migrationsDir)
	if err != nil {
		log.Fatalf("Failed to open embedded migrations: %v", err)
	}

	m, err := migrate.NewWithInstance("iofs", srcDriver, "sqlite3", driver)
	if err != nil {
		log.Fatalf("Migration init error: %v", err)
	}

	err = m.Up()
	if err != nil {
		if err != migrate.ErrNoChange {
			log.Fatalf("Migration apply error: %v", err)
		}
		log.Println("No migrations to apply.")
	}
	log.Println("Migrations completed.")
}

// GetQuestlineInfos fetches list of all questlines
func GetQuestlineInfos() ([]models.QuestlineInfo, error) {
	query := `
		SELECT ql.id, ql.name, ql.updated,
		  (SELECT COUNT(*) FROM quests WHERE questline_id=ql.id) AS total_quests,
		  (SELECT COUNT(*) FROM quests WHERE questline_id=ql.id AND completed=TRUE) AS completed_quests
		FROM questlines AS ql
		ORDER BY ql.updated DESC
	`

	rows, err := DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query questlines: %w", err)
	}
	defer rows.Close()

	infos := make([]models.QuestlineInfo, 0)
	for rows.Next() {
		var info models.QuestlineInfo

		if err := rows.Scan(&info.Id, &info.Name, &info.Updated, &info.TotalQuests, &info.CompletedQuests); err != nil {
			return nil, fmt.Errorf("failed to scan questline: %w", err)
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
		return nil, fmt.Errorf("failed to query questline %s: %w", id, err)
	}

	// fetch quests of questline
	questRows, err := DB.Query("SELECT id, title, description, pos_x, pos_y, color, completed FROM quests WHERE questline_id=?", id)
	if err != nil {
		return nil, fmt.Errorf("failed to query quests for questline %s: %w", id, err)
	}
	defer questRows.Close()

	questline.Quests = make([]models.Quest, 0)
	for questRows.Next() {
		var quest models.Quest
		err := questRows.Scan(&quest.Id, &quest.Title, &quest.Description, &quest.Position.X, &quest.Position.Y, &quest.Color, &quest.Completed)
		if err != nil {
			return nil, fmt.Errorf("failed to scan quest for questline %s: %w", id, err)
		}

		// fetch objectives for quest
		objectiveRows, err := DB.Query("SELECT id, text, completed, sort_index FROM objectives WHERE quest_id=? ORDER BY sort_index", quest.Id)
		if err != nil {
			return nil, fmt.Errorf("failed to query objectives for quest %s: %w", quest.Id, err)
		}
		defer objectiveRows.Close()

		quest.Objectives = make([]models.Objective, 0)
		for objectiveRows.Next() {
			var o models.Objective
			if err := objectiveRows.Scan(&o.Id, &o.Text, &o.Completed, &o.SortIndex); err != nil {
				return nil, fmt.Errorf("failed to scan objective for quest %s: %w", o.Id, err)
			}
			quest.Objectives = append(quest.Objectives, o)
		}

		questline.Quests = append(questline.Quests, quest)
	}

	// fetch dependencies in questline
	depRows, err := DB.Query("SELECT from_id, to_id FROM dependencies WHERE questline_id=?", id)
	if err != nil {
		return nil, fmt.Errorf("failed to query dependencies for questline %s: %w", id, err)
	}
	defer depRows.Close()

	questline.Dependencies = make([]models.Dependency, 0)
	for depRows.Next() {
		var d models.Dependency
		if err := depRows.Scan(&d.From, &d.To); err != nil {
			return nil, fmt.Errorf("failed to scan dependency for questline %s: %w", id, err)
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
			return fmt.Errorf("failed to update questline %s: %w", questline.Id, err)
		}

		// clear old quests (dependencies and objectives cascade deleted)
		_, err = tx.Exec("DELETE FROM quests WHERE questline_id=?", questline.Id)
		if err != nil {
			return fmt.Errorf("failed to delete old quests for questline %s: %w", questline.Id, err)
		}
	} else {
		if questline.Id == "" || questline.Id == "null" {
			questline.Id = uuid.New().String()
		}
		_, err := tx.Exec("INSERT INTO questlines (id, name, created, updated) VALUES (?,?,?,?)", questline.Id, questline.Name, now, now)
		if err != nil {
			return fmt.Errorf("failed to insert quest_line %s: %w", questline.Id, err)
		}
	}

	// insert quests
	questStmt, err := tx.Prepare("INSERT INTO quests (id, questline_id, title, description, pos_x, pos_y, color, completed) VALUES (?,?,?,?,?,?,?,?)")
	if err != nil {
		return fmt.Errorf("failed to prepare quest insert statement: %w", err)
	}
	defer questStmt.Close()

	objectiveStmt, err := tx.Prepare("INSERT INTO objectives (id, quest_id, text, completed, sort_index) VALUES (?,?,?,?,?)")
	if err != nil {
		return fmt.Errorf("failed to prepare objective insert statement: %w", err)
	}
	defer objectiveStmt.Close()

	for _, q := range questline.Quests {
		if q.Id == "" {
			return fmt.Errorf("quest found with empty ID for quest_line %s", questline.Id)
		}

		_, err := questStmt.Exec(q.Id, questline.Id, q.Title, q.Description, q.Position.X, q.Position.Y, q.Color, q.Completed)
		if err != nil {
			return fmt.Errorf("failed to insert quest %s for quest_line %s: %w", q.Id, questline.Id, err)
		}

		if len(q.Objectives) > 0 {
			for _, o := range q.Objectives {
				if o.Id == "" {
					return fmt.Errorf("objective found with empty ID for quest %s", q.Id)
				}
				_, err := objectiveStmt.Exec(o.Id, q.Id, o.Text, o.Completed, o.SortIndex)
				if err != nil {
					return fmt.Errorf("failed to insert checklist item %s for quest %s: %w", o.Id, q.Id, err)
				}
			}
		}
	}

	// insert dependencies
	if len(questline.Dependencies) > 0 {
		depStmt, err := tx.Prepare("INSERT INTO dependencies (questline_id, from_id, to_id) VALUES (?,?,?)")
		if err != nil {
			return fmt.Errorf("failed to prepare dependency insert statement: %w", err)
		}
		defer depStmt.Close()

		for _, d := range questline.Dependencies {
			_, err := depStmt.Exec(questline.Id, d.From, d.To)
			if err != nil {
				return fmt.Errorf("failed to insert dependency for quest_line %s (from %s to %s): %w", questline.Id, d.From, d.To, err)
			}
		}
	}

	return nil
}

// CreateQuestline creates new questline
func CreateQuestline(questline *models.Questline) (*models.Questline, error) {
	questline.Id = uuid.New().String()

	tx, err := DB.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin create questline transaction %s: %w", questline.Id, err)
	}
	if err := saveQuestline(tx, questline, false); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to save questline %s: %w", questline.Id, err)
	}
	tx.Commit()
	return GetQuestline(questline.Id)
}

// UpdateQuestline updates existing questline
func UpdateQuestline(questline *models.Questline) (*models.Questline, error) {
	tx, err := DB.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin update questline transaction %s: %w", questline.Id, err)
	}
	if err := saveQuestline(tx, questline, true); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to save questline %s: %w", questline.Id, err)
	}
	tx.Commit()
	return GetQuestline(questline.Id)
}

// DeleteQuestline deletes questline
func DeleteQuestline(id string) error {
	_, err := DB.Exec("DELETE FROM questlines WHERE id=?", id)
	if err != nil {
		return fmt.Errorf("failed to delete questline %s: %w", id, err)
	}
	return nil
}
