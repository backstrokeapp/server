# vim: set autoindent noexpandtab tabstop=4 shiftwidth=4 syntax=Make :
BABEL = ./node_modules/.bin/babel
LIVESERVER = ./node_modules/.bin/live-server
CONCURRENTLY = ./node_modules/.bin/concurrently
NODEMON = ./node_modules/.bin/nodemon
NODESASS = ./node_modules/.bin/node-sass

BUILD = build/

.PHONY: build
build:
	# Transpile all javascript into dist folder.
	# ie, src/foo.js => dist/foo.js
	$(BABEL) src/ -d dist \
		--ignore=node_modules,dist,src/components/template \
		--presets=babel-preset-es2015,babel-preset-react \
		--plugins=babel-plugin-transform-object-rest-spread

	# Compile all scss to css.
	# ie, src/foo.scss => build/output.css
	$(NODESASS) src/ \
		--ignore=node_modules,dist,src/components/template \
		-o sass_dist/
	find sass_dist -type f -exec cat '{}' ';' > build/styles.css
	rm -rf sass_dist/

	# Create build folder
	mkdir -p $(BUILD)

	# Copy assets
	cp -R assets/ build/assets/

	# Render the exported jsx from each page into a html file
	for i in `find dist -type f -name "*.js" -maxdepth 1`; do \
		node dist/helpers/render-page.js ../../$$i \
			> build/`basename $${i%.*}`.html; \
	done

.PHONY: watch
watch:
	# Make initial build
	make build

	# 1. Watch for changes and build on change
	# 2. Start the live server
	$(CONCURRENTLY) \
		"$(NODEMON) --exec 'make build' -w src/" \
		"node dist/helpers/live-server.js"
