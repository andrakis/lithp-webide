LIBS=
RUN=node_modules/lithp/run
GENFILES=./genfiles.sh
RUNFLAGS=
EXTRA_PATHS="../../modules ../../webide"

.PHONY: webide modules lithp-pkg.js pre clean
default: pre links modules lithp-pkg.js
all: default


pre:
	rm -f node_modules/lithp-pkg/files.js

links:
	if [ ! -L "run" ]; then \
		ln -s node_modules/lithp/run.js run; \
	fi

lithp-pkg.js: modules webide
	$(MAKE) -C node_modules/lithp-pkg files.js EXTRA_PATHS=$(EXTRA_PATHS)
	cp node_modules/lithp-pkg/files.js .
	node_modules/.bin/browserify index.js -o lithp-pkg.js
	cp lithp-pkg.js html/

modules:
	$(MAKE) -C modules

webide:
	$(MAKE) -C webide

clean:
	rm -f lithp-pkg.js
	$(MAKE) -C node_modules/lithp-pkg clean
	$(MAKE) -C modules clean
	$(MAKE) -C webide clean
