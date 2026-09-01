# Tech4All

Piattaforma web per l'alfabetizzazione digitale: tutorial guidati, quiz di verifica e badge che
certificano i traguardi raggiunti.

> Progetto di gruppo del corso di **Ingegneria del Software** (Università degli Studi di Salerno,
> A.A. 2024/2025), realizzato da un team di dieci persone con la progettazione svolta a monte
> dell'implementazione secondo il metodo di Brügge.

## Architettura

Due applicazioni separate che comunicano solo via HTTP.

```
┌──────────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│  client (Next.js)    │  ───────────────────▶    │  server (Express)    │
│  React 19, TS        │  ◀───────────────────    │  TypeScript          │
│  Pages Router        │   cookie httpOnly (JWT)  │  service + DAO       │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │ mysql2
                                                  ┌──────────▼───────────┐
                                                  │  MySQL 8             │
                                                  └──────────────────────┘
```

Il back-end è organizzato per sottosistemi, ciascuno con la stessa stratificazione:

| Strato | Responsabilità | Cartella |
|---|---|---|
| Rotte | validazione della forma della richiesta, autorizzazione, serializzazione | `server/src/app/routes` |
| Servizi | regole di dominio, transazioni | `server/src/app/services` |
| DAO | accesso a MySQL | `server/src/app/dao` |
| Entità | modello di dominio | `server/src/app/entity` |
| DTO | unico punto di serializzazione verso l'esterno | `server/src/app/dto` |

I sottosistemi applicativi sono sei: **autenticazione**, **gestione account**, **gestione
tutorial**, **gestione quiz**, **gestione feedback** e **gestione obiettivi**. A essi si affiancano
il middleware di sicurezza e lo strato di accesso ai dati, che tutti gli altri utilizzano.

## Avvio

Servono Node.js **≥ 20.9** (la CI usa la 22) e MySQL **≥ 8.0**. Le due applicazioni si avviano
separatamente.

```bash
# Server — database, poi API su http://localhost:5000
cd server
cp .env.example .env        # valorizza DB_* e JWT_SECRET
npm install
npm run db:reset            # schema + dati di esempio (db:setup crea il solo schema)
npm run dev                 # oppure: npm run build && npm start

# Client — interfaccia su http://localhost:3000
cd client
cp .env.example .env.local  # NEXT_PUBLIC_API_URL deve puntare al back-end
npm install
npm run dev
```

Gli script del database non richiedono il client `mysql` a riga di comando. `CLIENT_ORIGIN` sul
server deve coincidere con l'indirizzo del client: il cookie di sessione attraversa il confine fra le
due origini, e la specifica CORS non ammette un'origine generica quando la richiesta include le
credenziali.

Account di prova, con password memorizzate come hash bcrypt: `admin@example.com` / `AdminPass3@`
(amministratore) e `user1@example.com` / `Password1@` (utente).

Entrambe le applicazioni espongono `npm run typecheck` e `npm run lint`; solo il server ha
`npm test` e `npm run test:coverage`.

## Testing

```bash
cd server && npm run test:coverage
```

232 asserzioni su 13 suite, tutte **lato server**: unit sui servizi (DAO iniettati dal costruttore) e
integrazione sulle rotte con `supertest`. Nessun test apre una connessione a MySQL — il pool è
sostituito da un mock — quindi la suite gira ovunque senza database né variabili d'ambiente reali.

Le soglie di copertura (85% di istruzioni, righe e funzioni, 80% delle diramazioni) sono verificate
da Jest e quindi dalla CI: non sono un dato riportato a posteriori. La copertura è misurata sul
codice che contiene decisioni — servizi, rotte, middleware, errori e serializzazione.

Il client non ha test automatici: la CI lo copre con lint, typecheck e build. La pipeline
(`.github/workflows/ci.yml`) esegue entrambe le applicazioni a ogni push e pull request.

## Sicurezza

La sessione è un JWT firmato trasmesso in un cookie `httpOnly`, quindi non leggibile dal JavaScript
di pagina; le password sono hash bcrypt e non lasciano mai il server. Ogni rotta che modifica dati
passa da `requireAuth` o `requireAdmin` e prende l'identità dal token, mai dal corpo della
richiesta. L'HTML dei tutorial è sanificato in ingresso, i nomi dei file caricati sono generati dal
server, e la correzione dei quiz avviene solo lato server: il quiz inviato al client non contiene
l'indicazione della risposta corretta.

Il capitolo sulla sicurezza dello [SDD](docs/pdf/Tech4All_SDD.pdf) motiva ciascuna di queste scelte.

## Stato delle funzionalità

Sono implementati registrazione, accesso e gestione del proprio account; catalogo dei tutorial con
ricerca e filtro; creazione, modifica ed eliminazione di tutorial e quiz da parte degli
amministratori; svolgimento dei quiz con correzione lato server; feedback con moderazione; obiettivi
e badge assegnati automaticamente al raggiungimento delle soglie.

Restano fuori perimetro il **chatbot proprietario** — l'assistenza conversazionale è delegata a un
widget Voiceflow, abilitato solo se `NEXT_PUBLIC_VOICEFLOW_PROJECT_ID` è configurato — il **recupero
della password**, che richiederebbe messaggi di posta transazionali e quindi un servizio esterno con
dominio verificato, e il **supporto multilingua**: interfaccia e contenuti sono in italiano.

## Documentazione

La documentazione di prodotto è in [`docs/`](docs/), scritta in LaTeX con diagrammi UML generati da
sorgenti PlantUML versionati, ed è mantenuta allineata al codice.

| Documento | Contenuto |
|---|---|
| [RAD](docs/pdf/Tech4All_RAD.pdf) | Requisiti, scenari, casi d'uso, modello a oggetti, modello dinamico, interfaccia utente |
| [SDD](docs/pdf/Tech4All_SDD.pdf) | Architettura, sottosistemi, dati persistenti, sicurezza, progettazione degli oggetti |
| [Test Document](docs/pdf/Tech4All_TEST.pdf) | Strategia, derivazione e specifica dei casi di test, risultati, copertura, limiti |

I tre documenti sono legati da una catena di tracciabilità continua: ogni requisito è riconducibile a
un caso d'uso, a un meccanismo di progettazione e ai casi di test che lo verificano. Istruzioni di
compilazione e convenzioni redazionali sono in [`docs/README.md`](docs/README.md).

`ProjectDocs/` è l'archivio delle consegne del corso: documentazione di management (business case,
WBS, gestione dei rischi, pianificazione, retrospettiva) e i documenti di prodotto dell'epoca, che
`docs/` ha sostituito. I due RAD e i due SDD sono documenti diversi: quelli correnti sono in
`docs/pdf/`.

## Crediti

Progetto realizzato dal gruppo **C06** del corso di Ingegneria del Software (A.A. 2024/2025):
Ferdinando Boccia e Domenico D'Antuono (project manager), Marco Capuano, Giovanni
Cerchia, Arcangelo Ciaramella, Silvana De Martino, Giovanni Esposito, Luigi Nasta, Giovanni Salsano,
Giuseppe Staiano.
