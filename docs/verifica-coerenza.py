#!/usr/bin/env python3
"""Verifica la coerenza degli identificativi fra i documenti di Tech4All.

Controlla che ogni identificativo citato (requisito, caso d'uso, scenario,
caso di test, obiettivo di progettazione, decisione) sia definito dove deve
esserlo, e che nulla di definito resti orfano.

Uso:  python docs/verifica-coerenza.py
Esce con codice 1 se rileva un'incoerenza.
"""
from __future__ import annotations

import io
import os
import re
import sys

RADICE = os.path.dirname(os.path.abspath(__file__))
LATEX = os.path.join(RADICE, "latex")

# Un identificativo compare come \id{RF\_AU\_1}: nel sorgente LaTeX
# l'underscore è preceduto da una barra rovesciata.
RIFERIMENTO = re.compile(r"\\id\{([A-Z]{2,4}(?:\\_[A-Za-z0-9]+)+)\}")


def normalizza(grezzo: str) -> str:
    return grezzo.replace("\\_", "_")


def leggi(documento: str) -> dict[str, str]:
    """Restituisce {percorso relativo: contenuto} dei sorgenti di un documento."""
    base = os.path.join(LATEX, documento)
    contenuti = {}
    for radice, _, file in os.walk(base):
        for nome in file:
            if nome.endswith(".tex"):
                percorso = os.path.join(radice, nome)
                relativo = os.path.relpath(percorso, LATEX).replace("\\", "/")
                contenuti[relativo] = io.open(percorso, encoding="utf-8").read()
    return contenuti


def identificativi(contenuti: dict[str, str], prefisso: str) -> set[str]:
    trovati = set()
    for testo in contenuti.values():
        for grezzo in RIFERIMENTO.findall(testo):
            nome = normalizza(grezzo)
            if nome.startswith(prefisso + "_"):
                trovati.add(nome)
    return trovati


def controlla(etichetta: str, attesi: set[str], presenti: set[str]) -> list[str]:
    """Confronta due insiemi e descrive le differenze."""
    problemi = []
    mancanti = sorted(attesi - presenti)
    orfani = sorted(presenti - attesi)
    if mancanti:
        problemi.append(f"{etichetta}: citati ma non definiti -> {', '.join(mancanti)}")
    if orfani:
        problemi.append(f"{etichetta}: definiti ma mai citati -> {', '.join(orfani)}")
    return problemi


def main() -> int:
    rad = leggi("rad")
    sdd = leggi("sdd")
    test = leggi("test")

    problemi: list[str] = []

    # --- I requisiti sono definiti nelle appendici del RAD -------------------
    rf_definiti = identificativi(
        {k: v for k, v in rad.items() if "A-requisiti" in k}, "RF"
    )
    rf_citati = identificativi({**rad, **sdd, **test}, "RF")
    problemi += controlla("Requisiti funzionali", rf_citati, rf_definiti)

    # --- I casi d'uso sono definiti nell'elenco del RAD ----------------------
    uc_definiti = identificativi(
        {k: v for k, v in rad.items() if "04-modelli" in k}, "UC"
    )
    uc_citati = identificativi({**rad, **sdd, **test}, "UC")
    problemi += controlla("Casi d'uso", uc_citati, uc_definiti)

    # --- I casi di test sono definiti nel capitolo di specifica e in quello
    #     di derivazione, che contiene l'esempio svolto per esteso -----------
    tc_definiti = identificativi(
        {
            k: v
            for k, v in test.items()
            if "04-casi-di-test" in k or "03-derivazione" in k
        },
        "TC",
    )
    tc_citati = identificativi(test, "TC")
    problemi += controlla("Casi di test", tc_citati, tc_definiti)

    # --- Gli obiettivi di progettazione sono definiti nell'intro del SDD -----
    dg_definiti = identificativi(
        {k: v for k, v in sdd.items() if "01-introduzione" in k}, "DG"
    )
    dg_citati = identificativi(sdd, "DG")
    problemi += controlla("Obiettivi di progettazione", dg_citati, dg_definiti)

    # --- Ogni requisito funzionale deve avere almeno un caso di test ---------
    tracciabilita = "".join(
        v for k, v in test.items() if "A-tracciabilita" in k
    )
    tracciati = {normalizza(g) for g in RIFERIMENTO.findall(tracciabilita)}
    non_verificati = sorted(r for r in rf_definiti if r not in tracciati)
    if non_verificati:
        problemi.append(
            "Requisiti funzionali senza casi di test associati -> "
            + ", ".join(non_verificati)
        )

    # --- Riepilogo ----------------------------------------------------------
    print(f"Requisiti funzionali definiti:      {len(rf_definiti)}")
    print(f"Casi d'uso definiti:                {len(uc_definiti)}")
    print(f"Casi di test specificati:           {len(tc_definiti)}")
    print(f"Obiettivi di progettazione:         {len(dg_definiti)}")
    print()

    if problemi:
        print("INCOERENZE RILEVATE:")
        for p in problemi:
            print("  -", p)
        return 1

    print("Nessuna incoerenza rilevata fra i tre documenti.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
