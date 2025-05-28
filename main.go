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
var embeddedFiles embed.FS

func main() {
	port := "8080"
	dbPath := "questlines.db"
	//frontend := "frontend/dist"

	// init db
	if err := db.InitDB(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.DB.Close()

	r := chi.NewRouter()

	// setup middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:" + port}, // TODO: 3000 needed?
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// setup API routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/questlines", api.CreateQuestlineHandler)
		r.Get("/questlines", api.GetQuestlinesHandler)
		r.Get("/questlines/{id}", api.GetQuestlineHandler)
		r.Put("/questlines/{id}", api.UpdateQuestlineHandler)
		r.Delete("/questlines/{id}", api.DeleteQuestlineHandler)
		r.Get("/questlines/{id}/export", api.ExportQuestlineHandler)
	})

	// get frontend assets
	distFS, err := fs.Sub(embeddedFiles, "frontend/dist")
	if err != nil {
		log.Fatalf("Failed to get embedded subdirectory: %v", err)
	}

	// file server for serving frontend
	fsHandler := http.FileServer(http.FS(distFS))

	// handle requests
	r.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
		// If API, let Chi handle it (it should have already, so this 404s unhandled API)
		if strings.HasPrefix(r.URL.Path, "/api/") {
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
			indexHTML, err := embeddedFiles.ReadFile("frontend/dist/index.html")
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
