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
		log.Printf("Failed to enable foreign keys: %v", err)
		return err
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
