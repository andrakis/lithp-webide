LIBS=
RUN=node_modules/lithp/run
GENFILES=./genfiles.sh
RUNFLAGS=-cc
EXTRA_PATHS="../../modules ../../webide"
# See package.json for stringify settings
BROWSERIFY_OPTS=-t [ stringify ]

.PHONY: webide modules lithp-pkg.js pre links clean
default: pre links modules lithp-pkg.js
all: default

pre:
	rm -f node_modules/lithp-pkg/files.js
	rm -f node_modules/lithp-pkg/samples.js

links:
	if [ ! -L "run" ]; then \
		ln -s node_modules/lithp/run.js run; \
	fi
	if [ ! -L "lithp" ]; then \
		ln -s node_modules/lithp lithp; \
	fi

lithp-pkg.js: modules webide
	$(MAKE) -C node_modules/lithp-pkg files.js EXTRA_PATHS=$(EXTRA_PATHS)
	$(MAKE) -C node_modules/lithp-pkg samples.js EXTRA_PATHS=$(EXTRA_PATHS)
	cp node_modules/lithp-pkg/files.js .
	cp node_modules/lithp-pkg/samples.js .
	node_modules/.bin/browserify index.js $(BROWSERIFY_OPTS) samples.js -o lithp-pkg.js
	cp lithp-pkg.js html/

modules:
	$(MAKE) -C modules RUNFLAGS="$(RUNFLAGS)"

webide:
	$(MAKE) -C webide

update: clean
	npm update

clean:
	rm -f lithp-pkg.js
	$(MAKE) -C node_modules/lithp-pkg clean
	$(MAKE) -C modules clean
	$(MAKE) -C webide clean
