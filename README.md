# Tech4All

Piattaforma web per l'alfabetizzazione digitale: tutorial guidati, quiz di
verifica e badge che certificano i traguardi raggiunti. Nasce come progetto del
corso di **Ingegneria del Software** (Università degli Studi di Salerno), con la
progettazione svolta a monte dell'implementazione secondo il metodo di Brügge.

---

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

Il back-end è organizzato per sottosistemi, ciascuno con la stessa
stratificazione:

| Strato | Responsabilità | Cartella |
|---|---|---|
| Rotte | validazione della forma della richiesta, autorizzazione, serializzazione | `server/src/app/routes` |
| Servizi | regole di dominio, transazioni | `server/src/app/services` |
| DAO | accesso a MySQL | `server/src/app/dao` |
| Entità | modello di dominio | `server/src/app/entity` |
| DTO | unico punto di serializzazione verso l'esterno | `server/src/app/dto` |

I sottosistemi applicativi sono sei: **autenticazione**, **gestione account**,
**gestione tutorial**, **gestione quiz**, **gestione feedback** e **gestione
obiettivi**. A essi si affiancano il middleware di sicurezza e lo strato di
accesso ai dati, che tutti gli altri utilizzano.

---

## Prerequisiti

- Node.js **≥ 20.9** (la CI usa la versione 22)
- MySQL **≥ 8.0**

## Avvio

### 1. Database

```bash
cd server
cp .env.example .env        # e valorizza DB_* e JWT_SECRET
npm install
npm run db:reset            # crea lo schema e inserisce i dati di esempio
```

`npm run db:setup` crea il solo schema; `npm run db:reset` aggiunge anche i dati
di esempio. Gli script non richiedono il client `mysql` a riga di comando.

Account di prova (le password sono memorizzate come hash bcrypt):

| Email | Password | Ruolo |
|---|---|---|
| `admin@example.com` | `AdminPass3@` | amministratore |
| `user1@example.com` | `Password1@` | utente |

### 2. Back-end

```bash
cd server
npm run dev                 # sviluppo, con ricarica automatica
# oppure
npm run build && npm start  # esecuzione dal codice compilato
```

Il server ascolta su `http://localhost:5000` (configurabile con `PORT`).

### 3. Front-end

```bash
cd client
cp .env.example .env.local  # NEXT_PUBLIC_API_URL deve puntare al back-end
npm install
npm run dev
```

L'interfaccia è su `http://localhost:3000`. `CLIENT_ORIGIN` sul server deve
coincidere con questo indirizzo: il cookie di sessione attraversa il confine fra
le due origini, e la specifica CORS non ammette un'origine generica quando la
richiesta include le credenziali.

---

## Script

| Comando | Server | Client |
|---|---|---|
| `npm run dev` | avvio in sviluppo | avvio in sviluppo |
| `npm run build` | compila in `dist/` | build di produzione |
| `npm start` | esegue `dist/server.js` | espone la build di produzione |
| `npm run typecheck` | ✓ | ✓ |
| `npm run lint` / `lint:fix` | ✓ | ✓ |
| `npm test` / `test:coverage` | ✓ | — |
| `npm run db:setup` / `db:reset` | ✓ | — |

---

## Testing

```bash
cd server && npm run test:coverage
```

232 test su 13 suite: **unit** sui servizi (DAO iniettati dal costruttore) e
**integrazione** sulle rotte con `supertest`. Nessun test apre una connessione a
MySQL: il pool è sostituito da un mock, quindi la suite gira ovunque senza
database né variabili d'ambiente reali.

Le soglie di copertura (85% delle istruzioni, 80% delle diramazioni) sono
verificate da Jest e quindi dalla CI: non sono un dato riportato a posteriori.
La copertura è misurata sul codice che contiene decisioni — servizi, rotte,
middleware, errori e serializzazione.

La CI (`.github/workflows/ci.yml`) esegue lint, typecheck, test e build su
entrambe le applicazioni a ogni push e pull request.

---

## Sicurezza

- Le password sono memorizzate come hash **bcrypt** e non lasciano mai il server.
- La sessione è un **JWT firmato, trasmesso in un cookie `httpOnly`**: il
  JavaScript della pagina non può leggerlo, quindi un attacco XSS non basta a
  sottrarlo.
- Ogni rotta che modifica dati è protetta da `requireAuth` o `requireAdmin`, e
  l'identità dell'operazione è presa dal token: nessun identificativo utente
  viene accettato dal corpo della richiesta.
- L'HTML dei tutorial è **sanificato in ingresso** con `sanitize-html`.
- I nomi dei file caricati sono generati dal server; la cancellazione delle
  immagini accetta solo nomi semplici, risolti all'interno della cartella
  consentita.
- La correzione dei quiz avviene **solo sul server**: il quiz inviato al client
  non contiene l'indicazione della risposta corretta.

---

## Stato delle funzionalità

**Implementato:** registrazione, accesso e gestione del proprio account
(modifica dei dati, cambio della password, cancellazione); catalogo dei tutorial
con ricerca e filtro per categoria; creazione, modifica ed eliminazione di
tutorial e quiz da parte degli amministratori; svolgimento dei quiz con
correzione lato server; feedback sui tutorial con moderazione; obiettivi e badge
assegnati automaticamente al raggiungimento delle soglie.

**Fuori perimetro**, con la relativa motivazione:

- **Chatbot proprietario.** L'assistenza conversazionale è delegata a un widget
  Voiceflow, componente esterno che viene abilitato solo se
  `NEXT_PUBLIC_VOICEFLOW_PROJECT_ID` è configurato. Realizzarne uno proprio
  esulerebbe dagli obiettivi del progetto.
- **Recupero della password.** Richiede l'invio di messaggi di posta
  transazionali, quindi un servizio esterno e un dominio verificato.
- **Supporto multilingua.** L'interfaccia e i contenuti sono in italiano.

---

## Documentazione

La documentazione di prodotto è in [`docs/`](docs/), scritta in LaTeX con
diagrammi UML generati da sorgenti PlantUML versionati, ed è mantenuta
allineata al codice.

| Documento | Contenuto |
|---|---|
| [RAD](docs/pdf/Tech4All_RAD.pdf) | Requisiti, scenari, casi d'uso, modello a oggetti, modello dinamico, interfaccia utente |
| [SDD](docs/pdf/Tech4All_SDD.pdf) | Architettura, sottosistemi, dati persistenti, sicurezza, progettazione degli oggetti |
| [Test Document](docs/pdf/Tech4All_TEST.pdf) | Strategia, derivazione e specifica dei casi di test, risultati, copertura, limiti |

I tre documenti sono legati da una catena di tracciabilità continua: ogni
requisito è riconducibile a un caso d'uso, a un meccanismo di progettazione e
ai casi di test che lo verificano. Istruzioni di compilazione e convenzioni
redazionali sono in [`docs/README.md`](docs/README.md).

`ProjectDocs/` raccoglie la documentazione di management del progetto
(business case, WBS, gestione dei rischi, pianificazione, retrospettiva) e le
consegne effettuate durante il corso.

---

## Crediti

Progetto realizzato dal gruppo **C06** del corso di Ingegneria del Software
(A.A. 2024/2025): Ferdinando Boccia e Domenico D'Antuono (project manager),
Marco Capuano, Giovanni Cerchia, Arcangelo Ciaramella, Silvana De Martino,
Giovanni Esposito, Luigi Nasta, Giovanni Salsano, Giuseppe Staiano.
