LIBS=
RUN=../run
RUNFLAGS=

AST = $(patsubst %.lithp, %.ast, $(wildcard *.lithp))

default: $(AST) final $(SUBDIRS)
all: default

FINAL=

%.ast: %.lithp
	$(eval FINAL += $<)

final:
	@if [ "$(FINAL)"x != "x" ]; then $(RUN) $(RUNFLAGS) -c $(FINAL); fi

clean:
	-rm -f *.ast

