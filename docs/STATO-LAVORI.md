# Stato dei lavori

Promemoria per riprendere il lavoro tra una sessione e l'altra.

## Riscrittura dei capitoli per principianti (in pausa dopo la 1.19.5)

Criteri: una piccola trama per capitolo; si scrive presto nel terminale; ogni termine spiegato
dove compare; Nyx (e Rook, Mama) come voci; le lezioni non ripetono le schede "Nyx spiega";
non si toglie nulla; esercizi nuovi marcati `since: 19` con `solve`; linguaggio neutro verso
chi gioca (niente "bravo", "pronto", "benvenuto" al maschile).

| Capitolo | Stato |
|---|---|
| 01 Terminale | riscritto (1.18.0) |
| F Fondamenti | riscritto (1.19.0) |
| 02 Rete di quartiere | riscritto (1.19.1) |
| 03 Linux in profondità | riscritto (1.19.2) |
| 04 Primo turno al SOC | riscritto (1.19.3) |
| AM Amministrare Linux | rivisto (1.19.4) |
| 05 Scripting | rivisto (1.19.5) |
| 06 Crittografia | **prossimo** |
| PY, 07, 08, SOC, 09, 10, 11, PT, 12, DF, SJ, 13 | da fare |

Filo della trama finora: notte da Nyx (01) → giornata da Rook (F) → pentest al bar di Mama (02)
→ vecchio server (03) → intrusione e cryptominer (04) → il sito sul deck, Luca in ferie (AM)
→ automatizzare i controlli del mattino (05).

## Proposta "idea giochi.docx"

Documento dell'autore con l'evoluzione del sistema didattico (motore adattivo unico,
prerequisiti per esercizio, orientamento professionale, percorsi specializzati, portfolio).
Audit (fase A) presentato il 16 novembre 2026.

| Fase | Stato |
|---|---|
| A Audit | fatto |
| B-C Motore unico, prerequisiti, livello adattivo, ripasso, cruscotto | fatto (1.20.0) |
| D Giochi esistenti nel motore (Phishing/Triage legati al capitolo, feedback con esercizio diverso, domande sul perché) | fatto (1.21.0) |
| E Digital Crime Scene (SC-01, cresce con il corso) | fatto (1.22.0) |
| F Orientamento professionale | fatto (1.23.0) |
| G Percorsi specializzati, mentore a regole, lavoro in Italia | fatto (1.24.0) |
| H Collaudo | **prossima** |

Decisioni: tutor a regole (niente IA: niente credenziali nel client); dati sul lavoro in Italia
con fonte e data, ricontrollati a ogni versione (l'app funziona offline); Network Architect per ultimo.

Dati sul lavoro (src/content/jobs.ts): raccolti il 16 novembre 2026, da ricontrollare a ogni versione.

## Giochi aggiunti dopo la fase G (1.25–1.27)

Sfide 01-04 e Palestra seconda metà (1.25), Riparazioni, sfida finale di capitolo, casi
generati nei giochi (1.26), SC-02 e Architetto di rete (1.27). Prossimo, su richiesta
dell'autore: aumentare il numero di test (verifiche nel gioco), poi la fase H (collaudo).

## Test (1.28)

Riequilibrate 179 domande (giusta riconoscibile dalla lunghezza), +66 domande nelle missioni,
+35 domande d'esame, parte pratica con riparazione per AM/SOC/PT/DF/SJ. Resta: la giusta è
ancora la più lunga nel 49% dei casi (a caso sarebbe il 25%), ma di poco; da abbassare.
Prossimo: fase H (collaudo), poi la riscrittura dal capitolo 06.
