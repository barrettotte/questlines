package models

import "time"

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Quest struct {
	Id          string   `json:"id"`
	QuestlineId string   `json:"-"` // internal
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Position    Position `json:"position"`
	Color       string   `json:"color,omitempty"`
}

type Dependency struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type Questline struct {
	Id           string       `json:"id"`
	Name         string       `json:"name"`
	Quests       []Quest      `json:"quests"`
	Dependencies []Dependency `json:"dependencies"`
	Created      time.Time    `json:"created,omitempty"`
	Updated      time.Time    `json:"updated,omitempty"`
}

type QuestlineInfo struct {
	Id      string    `json:"id"`
	Name    string    `json:"name"`
	Updated time.Time `json:"updated"`
}
