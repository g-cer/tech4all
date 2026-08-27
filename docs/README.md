# Documentazione di Tech4All

Documentazione di prodotto redatta in LaTeX, con diagrammi UML generati da
sorgenti testuali versionati.

I documenti sono mantenuti allineati al codice: nessun requisito, servizio o
pattern documentato è privo di riscontro nei sorgenti, e ciò che è fuori
perimetro è dichiarato tale con la relativa motivazione.

## I tre documenti

| Documento | Contenuto | Pagine |
|---|---|---|
| [RAD](pdf/Tech4All_RAD.pdf) — *Requirements Analysis Document* | Dominio, attori, requisiti funzionali e non funzionali, scenari, casi d'uso, modello a oggetti, modello dinamico, interfaccia utente | 44 |
| [SDD](pdf/Tech4All_SDD.pdf) — *System Design Document* | Obiettivi di progettazione, sottosistemi, dati persistenti, sicurezza, condizioni limite, progettazione degli oggetti, decisioni motivate | 42 |
| [Test Document](pdf/Tech4All_TEST.pdf) | Strategia di verifica, derivazione dei casi di test, specifica, esecuzione, difetti, copertura, limiti | 40 |

Rispetto all'impostazione di Brügge, l'*Object Design Document* è un capitolo
dello SDD e i quattro documenti di testing sono riuniti in uno solo: per un
sistema di questa scala mantenerli separati produce ripetizione senza
aggiungere rigore. La scelta è motivata nell'introduzione dei rispettivi
documenti.

### Tracciabilità

I tre documenti formano una catena continua, verificabile appendice per
appendice:

```
requisito ──► caso d'uso ──► scenario          (RAD, appendice B)
requisito ──► design goal ──► meccanismo       (SDD, appendice A)
requisito ──► classe/rotta ──► caso di test    (Test Document, appendice A)
```

## Struttura

```
docs/
├── Makefile                 build di diagrammi e documenti
├── pdf/                     PDF finali (versionati)
├── diagrams/
│   ├── src/                 sorgenti PlantUML (.puml)
│   ├── out/                 PDF dei diagrammi (generati)
│   └── tools/               plantuml.jar (non versionato)
└── latex/
    ├── shared/              stile, frontespizio, glossario, bibliografia
    ├── rad/                 main.tex + capitoli/
    ├── sdd/                 main.tex + capitoli/
    └── test/                main.tex + capitoli/
```

Stile, frontespizio, glossario e bibliografia sono definiti una sola volta in
`latex/shared/` e inclusi dai tre documenti. È la ragione per cui il glossario
è identico ovunque e i documenti si assomigliano: un termine si definisce in
un punto solo, e una correzione allo stile si propaga a tutto il set.

## Compilazione

### Prerequisiti

- **LaTeX**: MiKTeX o TeX Live, con `latexmk`, `biber` ed `epstopdf`
- **Java** 17 o superiore, per PlantUML
- **Graphviz**, richiesto da PlantUML per i diagrammi non sequenziali
- **GNU Make**

### Comandi

```bash
cd docs

make plantuml     # scarica il renderer dei diagrammi (una volta sola)
make              # diagrammi, tre documenti e verifica di coerenza
make diagrams     # solo i diagrammi
make rad          # un solo documento (oppure: sdd, test)
make verifica     # solo la verifica di coerenza
make clean        # rimuove i file intermedi di LaTeX
make distclean    # rimuove anche diagrammi generati e PDF finali
```

I PDF finali sono prodotti in `pdf/`.

### Verifica di coerenza

`verifica-coerenza.py` controlla, sui sorgenti LaTeX, che:

- ogni requisito, caso d'uso, caso di test e obiettivo di progettazione
  citato sia definito nel documento che deve definirlo;
- nessun identificativo definito resti orfano, mai citato altrove;
- ogni requisito funzionale abbia almeno un caso di test associato nella
  matrice di tracciabilità.

Fa parte di `make`: una lacuna nella tracciabilità interrompe la
compilazione invece di passare inosservata. È lo stesso principio delle
soglie di copertura nel codice — un vincolo verificato, non una dichiarazione
d'intenti.

### Perché il jar di PlantUML non è versionato

`plantuml.jar` pesa circa 17 MB e non è codice del progetto: `make plantuml`
lo scarica dalle release ufficiali. Serve solo per rigenerare i diagrammi, non
per leggerli: i PDF sono già in `diagrams/out/` dopo una compilazione, e i
documenti finali li includono.

### Perché i PDF finali sono versionati

È l'unica eccezione alla regola di non versionare artefatti generati. I
documenti sono un deliverable del progetto, e chi consulta il repository deve
poterli leggere senza installare una distribuzione LaTeX.

## Diagrammi

I 25 diagrammi sono scritti in PlantUML: sorgenti testuali di poche decine di
righe, versionati e leggibili in una diff. Modificare una relazione in un
diagramma è una riga cambiata, non un'immagine da ridisegnare.

| Tipo | Diagrammi |
|---|---|
| Casi d'uso | `uc-utente`, `uc-amministratore` |
| Attività | `ad-sistema-corrente`, `ad-apprendimento` |
| Classi (analisi) | `cd-analisi-entity`, `cd-analisi-bce` |
| Classi (progetto) | `cd-design-quiz`, `cd-errori` |
| Sequenza | `sd-svolgimento-quiz`, `sd-pubblicazione-tutorial`, `sd-autenticazione`, `sd-correzione-quiz` |
| Stato | `sc-svolgimento`, `sc-tutorial` |
| Componenti e deployment | `cmp-sottosistemi`, `dep-deployment`, `pkg-packages` |
| Entità-relazione | `er-database` |
| Navigazione | `np-navigazione` |
| Prototipi di interfaccia | `mu-catalogo`, `mu-tutorial`, `mu-quiz`, `mu-esito-quiz`, `mu-area-personale`, `mu-redazione-tutorial` |

Lo stile comune è in `diagrams/src/_stile.puml`: i file che iniziano con `_`
sono frammenti inclusi, non diagrammi, e il Makefile li esclude dalla
generazione.

### Nota sul formato

PlantUML produce EPS, che il Makefile converte in PDF con `epstopdf`. La
distribuzione MIT del renderer non genera PDF direttamente perché la libreria
necessaria non è compatibile con quella licenza; il passaggio da EPS mantiene
comunque il risultato vettoriale.

## Convenzioni redazionali

- **Lingua**: italiano; i termini tecnici senza equivalente consolidato
  restano in inglese e sono definiti nel glossario.
- **Identificativi**: `RF_<area>_<n>` requisiti funzionali, `RNF_<categoria>_<n>`
  non funzionali, `UC_<n>` casi d'uso, `SC_<n>` scenari, `DG_<n>` obiettivi di
  progettazione, `DP_<n>` decisioni di progetto, `TC_<area>_<n>` casi di test,
  `DF_<n>` difetti.
- **Gruppo di lavoro**: riportato nel frontespizio di ciascun documento, in
  forma uniforme, con la distinzione fra project manager e team member.
- **Cronologia delle revisioni**: non è riportata nei documenti. La fornisce
  Git, con più precisione e senza doverla mantenere a mano.
- **Tabelle**: `booktabs`, senza righe verticali né campiture colorate.
- **Rimandi**: tutti tramite `cleveref`; un riferimento irrisolto fa fallire
  il controllo di qualità della compilazione.
