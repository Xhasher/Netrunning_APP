# Chiave di firma dell'APK

`netrunning.keystore` firma tutti gli APK del gioco (build locali e GitHub Actions).
Android installa una nuova versione **come aggiornamento**, senza perdere i salvataggi,
solo se è firmata con la stessa chiave della versione già installata.

Credenziali (chiave di debug standard di Android): password `android`, alias `androiddebugkey`.

Nota: la chiave è pubblica in questo repository, quindi va bene per un'app installata
a mano (sideload). Prima di un'eventuale pubblicazione sul Play Store va creata una
chiave di rilascio privata, da non mettere mai nel repository.
