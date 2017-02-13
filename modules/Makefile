LIBS=
RUN=../run
RUNFLAGS=-cc

AST = $(patsubst %.lithp, %.ast, $(wildcard *.lithp))

default: $(AST) final $(SUBDIRS)
all: default
.PHONY: clean

FINAL=

%.ast: %.lithp
	$(eval FINAL += $<)

final:
	@if [ "$(FINAL)"x != "x" ]; then $(RUN) $(RUNFLAGS) -c $(FINAL); fi

clean:
	-rm -f *.ast

