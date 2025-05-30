BIN_NAME = questlines
BIN_DIR = bin

VUE_DIR = frontend

TARGET = $(BIN_DIR)/$(BIN_NAME)

.PHONY:	all
all:	build

.PHONY:	clean
clean:
	rm -rf $(BIN_DIR)/*

# ======== all ========

.PHONY:	build
build:	build_vue	build_go

.PHONY:	run
run:	run_go

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
	npm --prefix $(VUE_DIR) i
	npm --prefix $(VUE_DIR) run build_dev

.PHONY:	run_vue
run_vue:
	npm --prefix $(VUE_DIR) i
	npm --prefix $(VUE_DIR) run dev
