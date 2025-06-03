BIN_NAME = questlines
BIN_DIR = bin

VUE_DIR = frontend

TARGET = $(BIN_DIR)/$(BIN_NAME)

.PHONY:	all
all:	build

.PHONY:	clean
clean:
	rm -rf $(BIN_DIR)/*

.PHONY:	build
build:	clean	build_vue	build_go

.PHONY:	build_vue
build_vue:
	@echo "Building frontend..."
	npm --prefix $(VUE_DIR) i
	npm --prefix $(VUE_DIR) run build_dev

.PHONY:	build_go
build_go:
	@echo "Building backend..."
	@mkdir -p $(BIN_DIR)
	go build -ldflags="-w -s" -o $(TARGET) .

.PHONY:	run
run:	build
	./$(TARGET)
