LIBS=
RUN=node_modules/lithp/run
GENFILES=./genfiles.sh
RUNFLAGS=
EXTRA_PATHS=../../webide

.PHONY: webide
default: links webide lithp-pkg.js
all: default

links:
	if [ ! -e "run" ]; then \
		ln -s node_modules/lithp/run.js run; \
	fi

lithp-pkg.js: webide
	$(MAKE) -C node_modules/lithp-pkg files.js EXTRA_PATHS=$(EXTRA_PATHS)
	cp node_modules/lithp-pkg/index.js .
	cp node_modules/lithp-pkg/files.js .
	node_modules/.bin/browserify index.js -o lithp-pkg.js

webide:
	$(MAKE) -C webide

clean:
	rm -f lithp-pkg.js
	rm -f index.js
	$(MAKE) -C node_modules/lithp-pkg clean
	$(MAKE) -C webide clean
