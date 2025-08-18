# Makefile for Electron + Vite + React project


.PHONY: help dev build clean

help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  help   Show this help message"
	@echo "  dev    Run Vite dev server and Electron for development"
	@echo "  build  Build the app and output to build/"
	@echo "  clean  Remove build and dist directories"
	@echo "  lint   Run ESLint on the project"
	@echo "  run    Build and run Electron app from build/"

# Run Vite dev server and Electron together
# Requires concurrently (npm install --save-dev concurrently) for best experience
# If not installed, will run sequentially

dev:
	npm run dev

lint:
	npx eslint . --config eslint.config.js --ext .ts,.tsx,.js,.jsx

# Build Vite app and copy to build/
build: lint
	npm run build
	mkdir -p build
	cp -r dist/* build/
	cp main.cjs build/

run: build
	cp public/preload.cjs build/public/preload.cjs
	cd build && npx electron main.cjs

clean:
	rm -rf build dist
