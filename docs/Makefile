# =============================================================================
#  Documentazione di Tech4All
#
#    make            genera i diagrammi e compila i tre documenti
#    make diagrams   genera i soli diagrammi (PlantUML -> EPS -> PDF)
#    make rad        compila il solo RAD (idem: sdd, test)
#    make clean      rimuove i file intermedi di LaTeX
#    make distclean  rimuove anche i diagrammi generati e i PDF finali
#
#  Richiede: MiKTeX o TeX Live (latexmk, biber, epstopdf), Java, Graphviz.
#  Il renderer PlantUML non è versionato: si scarica con `make plantuml`.
# =============================================================================

SHELL      := /bin/sh
LATEXMK    := latexmk -pdf -interaction=nonstopmode -halt-on-error
JAVA       := java
EPSTOPDF   := epstopdf

DIAG_SRC   := diagrams/src
DIAG_OUT   := diagrams/out
PLANTUML   := diagrams/tools/plantuml.jar
PLANTUML_URL := https://github.com/plantuml/plantuml/releases/download/v1.2026.7/plantuml-mit-1.2026.7.jar

DOCS       := rad sdd test
PDF_OUT    := pdf

# I file che iniziano con `_` sono frammenti inclusi, non diagrammi.
PUML       := $(filter-out $(DIAG_SRC)/_%,$(wildcard $(DIAG_SRC)/*.puml))
DIAG_PDF   := $(patsubst $(DIAG_SRC)/%.puml,$(DIAG_OUT)/%.pdf,$(PUML))

.PHONY: all diagrams verifica clean distclean plantuml $(DOCS)

all: diagrams $(DOCS) verifica

# --- Coerenza fra i documenti ------------------------------------------------
# Controlla che ogni identificativo citato sia definito e che ogni requisito
# funzionale abbia almeno un caso di test associato.
verifica:
	@python verifica-coerenza.py

# --- Diagrammi --------------------------------------------------------------
# La distribuzione MIT di PlantUML non produce PDF direttamente (la libreria
# necessaria non è compatibile con quella licenza): si passa da EPS, che è
# comunque vettoriale, e si converte con epstopdf.
diagrams: $(DIAG_PDF)

$(DIAG_OUT)/%.pdf: $(DIAG_SRC)/%.puml | $(DIAG_OUT) $(PLANTUML)
	@echo "  [plantuml] $<"
	@$(JAVA) -jar $(PLANTUML) -teps -o "$(abspath $(DIAG_OUT))" $<
	@$(EPSTOPDF) --outfile=$@ $(DIAG_OUT)/$*.eps
	@rm -f $(DIAG_OUT)/$*.eps

$(DIAG_OUT):
	@mkdir -p $(DIAG_OUT)

$(PLANTUML):
	@echo "PlantUML non trovato. Eseguire 'make plantuml' per scaricarlo." && exit 1

plantuml:
	@mkdir -p $(dir $(PLANTUML))
	@echo "  [download] $(PLANTUML_URL)"
	@curl -sL -o $(PLANTUML) $(PLANTUML_URL)
	@$(JAVA) -jar $(PLANTUML) -version | head -1

# --- Documenti --------------------------------------------------------------
$(DOCS): %: diagrams | $(PDF_OUT)
	@echo "  [latexmk] $*"
	@cd latex/$* && $(LATEXMK) main.tex >/dev/null
	@cp latex/$*/main.pdf $(PDF_OUT)/Tech4All_$(shell echo $* | tr a-z A-Z).pdf
	@echo "  -> $(PDF_OUT)/Tech4All_$(shell echo $* | tr a-z A-Z).pdf"

$(PDF_OUT):
	@mkdir -p $(PDF_OUT)

# --- Pulizia ----------------------------------------------------------------
clean:
	@for d in $(DOCS); do (cd latex/$$d && latexmk -C >/dev/null 2>&1 || true); done
	@echo "File intermedi rimossi."

distclean: clean
	@rm -rf $(DIAG_OUT) $(PDF_OUT)
	@echo "Diagrammi e PDF finali rimossi."
