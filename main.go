package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"questlines/api"
	"questlines/db"
	"strings"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
)

//go:embed all:frontend/dist
var embeddedFrontend embed.FS

//go:embed db/migrations/*.sql
var embeddedMigrations embed.FS

func main() {
	port := "8080"
	dbPath := "questlines.db"
	migrationsDir := "db/migrations"
	frontendDir := "frontend/dist"
	baseApiPrefix := "/api"

	// init db
	if err := db.InitDB(dbPath, migrationsDir, embeddedMigrations); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.DB.Close()

	// setup middleware
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	allowedOrigins := []string{"http://localhost:" + port}

	// add vue dev port when in development mode
	appEnv := strings.ToLower(os.Getenv("APP_ENV"))
	if appEnv == "development" || appEnv == "dev" {
		devFrontendOrigin := "http://localhost:3000"
		allowedOrigins = append(allowedOrigins, devFrontendOrigin)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// setup API routes
	r.Route(baseApiPrefix, func(r chi.Router) {
		// questlines
		r.Post("/questlines", api.CreateQuestlineHandler)
		r.Get("/questlines", api.GetQuestlinesHandler)
		r.Get("/questlines/{id}", api.GetQuestlineHandler)
		r.Put("/questlines/{id}", api.UpdateQuestlineHandler)
		r.Delete("/questlines/{id}", api.DeleteQuestlineHandler)
		r.Get("/questlines/{id}/export", api.ExportQuestlineHandler)
		// misc
		r.Get("/up", api.UpHandler)
	})

	// get frontend assets
	distFS, err := fs.Sub(embeddedFrontend, frontendDir)
	if err != nil {
		log.Fatalf("Failed to get embedded subdirectory: %v", err)
	}

	// file server for serving frontend
	fsHandler := http.FileServer(http.FS(distFS))

	// handle requests
	r.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
		// If API, let Chi handle it (it should have already, so this 404s unhandled API)
		if strings.HasPrefix(r.URL.Path, baseApiPrefix) {
			http.NotFound(w, r)
			return
		}

		// Get the clean path relative to distFS
		fsPath := strings.TrimPrefix(r.URL.Path, "/")

		// Try to open the file from the embedded FS.
		// We do this mainly to check if it exists or not.
		f, err := distFS.Open(fsPath)

		// if file does not exists or base url, serve default
		if os.IsNotExist(err) || fsPath == "" {
			indexHTML, err := embeddedFrontend.ReadFile(frontendDir + "/index.html")
			if err != nil {
				log.Printf("ERROR: Could not read embedded index.html: %v", err)
				http.Error(w, "index.html not found", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(indexHTML)
			return
		}

		// misc error
		if err != nil {
			log.Printf("ERROR: Could not open static file %s: %v", fsPath, err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		f.Close()
		fsHandler.ServeHTTP(w, r)
	})

	log.Printf("Listening on port %s...", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
