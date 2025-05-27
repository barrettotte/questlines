APP_NAME = questlines
BIN_DIR = bin

TARGET = $(BIN_DIR)/$(APP_NAME)

.PHONY:	all
all:	build

.PHONY:	clean
clean:
	rm -rf $(BIN_DIR)/*

# ======== all ========

.PHONY:	build
build:	build_vue	build_go

.PHONY:	run
run:	run_vue	run_go

# ======== backend ========

.PHONY:	build_go
build_go:	clean
	@mkdir -p $(BIN_DIR)
	go build -o $(TARGET) .

.PHONY:	run
run_go:	build_go
	./$(TARGET)

.PHONY:	test_go
test_go:
	go test

# ======== frontend ========

.PHONY:	build_vue
build_vue:
	@echo "Building frontend..."
	npm --prefix frontend run build

.PHONY:	run_vue
run_vue:
	npm --prefix frontend run dev
