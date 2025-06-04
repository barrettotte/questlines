package api

import (
	"barrettotte/questlines/db"
	"barrettotte/questlines/models"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi"
)

type HealthStatus struct {
	Api bool `json:"api"`
	Db  bool `json:"db"`
}

// helper for sending json responses
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	resp, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshalling JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(resp)
}

// helper for sending error responses
func respondError(w http.ResponseWriter, code int, msg string) {
	log.Printf("error: %s", msg)
	respondJSON(w, code, map[string]string{"error": msg})
}

// UpHandler handles GET /api/up for health status
func UpHandler(w http.ResponseWriter, r *http.Request) {
	status := HealthStatus{Api: true, Db: false}

	if db.DB != nil {
		if err := db.DB.Ping(); err != nil {
			log.Printf("WARN: Health check DB ping failed: %v", err)
		} else {
			status.Db = true
		}
	} else {
		log.Printf("WARN: Health check found DB is nil")
	}
	respondJSON(w, http.StatusOK, status)
}

// GetQuestlinesHandler handles GET /api/questlines
func GetQuestlinesHandler(w http.ResponseWriter, r *http.Request) {
	infos, err := db.GetQuestlineInfos()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, infos)
}

// CreateQuestlineHandler handles POST /api.questlines
func CreateQuestlineHandler(w http.ResponseWriter, r *http.Request) {
	var toCreate models.Questline

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&toCreate); err != nil {
		log.Printf("Bad payload: %s", r.Body)
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	log.Printf("Creating questline\n%v", toCreate)

	created, err := db.CreateQuestline(&toCreate)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, created)
}

// GetQuestlineHandler handles GET /api/questlines/{id}
func GetQuestlineHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	ql, err := db.GetQuestline(id)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "Questline not found")
		} else {
			respondError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	respondJSON(w, http.StatusOK, ql)
}

// UpdateQuestlineHandler handles PUT /api/questline/{id}
func UpdateQuestlineHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var toUpdate models.Questline

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&toUpdate); err != nil {
		log.Printf("Bad payload: %s", r.Body)
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	log.Printf("Updating questline %s to\n%v", toUpdate.Id, toUpdate)

	if toUpdate.Id != id {
		respondError(w, http.StatusBadRequest, "ID mismatch between URL param and body")
		return
	}

	updated, err := db.UpdateQuestline(&toUpdate)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "Questline not found")
		} else {
			respondError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

// DeleteQuestlineHandler handles DELETE /api/questlines/{id}
func DeleteQuestlineHandler(w http.ResponseWriter, r *http.Request) {
	toDelete := chi.URLParam(r, "id")
	log.Printf("Deleting questline %s", toDelete)

	err := db.DeleteQuestline(toDelete)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Questline deleted successfully"})
}

// ExportQuestlineHandler handles GET /api/questlines/{id}/export
func ExportQuestlineHandler(w http.ResponseWriter, r *http.Request) {
	toExportId := chi.URLParam(r, "id")

	fmt := r.URL.Query().Get("fmt")
	if fmt == "" {
		fmt = "json" // default
	}

	toExport, err := db.GetQuestline(toExportId)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "Questline not found")
		} else {
			respondError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	var data []byte
	contentType := ""
	fileName := toExport.Name + "." + fmt

	log.Printf("Exporting questline %s to %s", toExportId, fileName)

	switch fmt {
	case "json":
		data, err = json.MarshalIndent(toExport, "", "  ")
		contentType = "application/json"
	default:
		respondError(w, http.StatusBadRequest, "Unsupported format")
		return
	}

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to marshal export data")
		return
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", "attachment; filename=\""+fileName+"\"")
	w.Write(data)
}
