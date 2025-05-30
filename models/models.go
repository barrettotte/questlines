package models

import (
	"fmt"
	"time"
)

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

func (p Position) String() string {
	return fmt.Sprintf("Position{X: %f, Y: %f}", p.X, p.Y)
}

type Quest struct {
	Id          string   `json:"id"`
	QuestlineId string   `json:"-"` // internal
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Position    Position `json:"position"`
	Color       string   `json:"color,omitempty"`
}

func (q Quest) String() string {
	return fmt.Sprintf(
		"Quest{Id: %q, QuestlineId: %v, Title: %v, Description: %v, Position: %v, Color: %v}",
		q.Id, q.QuestlineId, q.Title, q.Description, q.Position, q.Color,
	)
}

type Dependency struct {
	QuestlineId string `json:"-"` // internal
	From        string `json:"from"`
	To          string `json:"to"`
}

func (d Dependency) String() string {
	return fmt.Sprintf("Dependency{QuestlineId: %v, From: %v, To: %v}", d.QuestlineId, d.From, d.To)
}

type Questline struct {
	Id           string       `json:"id"`
	Name         string       `json:"name"`
	Quests       []Quest      `json:"quests"`
	Dependencies []Dependency `json:"dependencies"`
	Created      time.Time    `json:"created,omitempty"`
	Updated      time.Time    `json:"updated,omitempty"`
}

func (ql Questline) String() string {
	return fmt.Sprintf(
		"Questline{Id: %v, Name: %v, Quests: %v, Dependencies: %v, Created: %v, Updated: %v}",
		ql.Id, ql.Name, ql.Quests, ql.Dependencies, ql.Created.Format(time.RFC3339), ql.Updated.Format(time.RFC3339),
	)
}

type QuestlineInfo struct {
	Id      string    `json:"id"`
	Name    string    `json:"name"`
	Updated time.Time `json:"updated"`
}

func (q QuestlineInfo) String() string {
	return fmt.Sprintf("QuestlineInfo{Id: %v, Name: %v, Updated: %v}", q.Id, q.Name, q.Updated.Format(time.RFC3339))
}
