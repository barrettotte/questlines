package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"questlines/db"
	"questlines/models"

	"github.com/go-chi/chi"
)

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
	respondJSON(w, code, map[string]string{"error": msg})
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
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

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
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

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
	id := chi.URLParam(r, "id")
	err := db.DeleteQuestline(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Questline deleted successfully"})
}

// ExportQuestlineHandler handles GET /api/questlines/{id}/export
func ExportQuestlineHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	fmt := r.URL.Query().Get("fmt")
	if fmt == "" {
		fmt = "json" // default
	}

	toExport, err := db.GetQuestline(id)
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

	switch fmt {
	case "yaml":
		respondError(w, http.StatusBadRequest, "TODO: YAML export is not supported yet")
		return
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
