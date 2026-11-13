import { describe, expect, it } from 'vitest';
import { defaultSave, makeBackup, parseBackup } from '../src/game/state';
import { findMission } from '../src/content';
import { buildWorld } from '../src/content/world';
import { evaluate, stateOk } from '../src/game/logic';

describe('regressioni', () => {
  it('"Il tuo primo file": comandi scritti durante la lezione, poi cat sul passo del compito', () => {
    const sh = buildWorld('edge');
    const m = findMission('ch01-m6')!.mission;
    const task = m.steps.find((s) => s.title === 'Il tuo primo file')!;
    sh.run('cd laboratorio');
    sh.run('mkdir appunti');
    // eseguiti mentre era aperta la lezione precedente: nessun passo attivo
    sh.run('echo "ls elenca i file" > appunti/comandi.txt');
    sh.run('echo "cd cambia cartella" >> appunti/comandi.txt');
    // arrivato sul compito, l'obiettivo risulta già fatto...
    expect(stateOk(task, sh)).toBe(true);
    // ...e anche un semplice cat lo completa
    expect(evaluate(task, sh.run('cat appunti/comandi.txt').events, sh)).toBe('pass');
  });

  it('lo stato non completa un passo se il lavoro non è fatto', () => {
    const sh = buildWorld('edge');
    const task = findMission('ch01-m6')!.mission.steps.find((s) => s.title === 'Il tuo primo file')!;
    expect(stateOk(task, sh)).toBe(false);
    expect(evaluate(task, sh.run('ls').events, sh)).toBeNull();
  });

  it('la home del deck si salva e si ripristina', () => {
    const a = buildWorld('edge');
    a.run('mkdir -p laboratorio/appunti');
    a.run('echo "riga" > laboratorio/appunti/x.txt');
    a.run('chmod 600 README.txt');
    a.run('rm laboratorio/vecchio_log.txt');
    const data = JSON.parse(JSON.stringify(a.fs.serialize('/home/edge')));

    const b = buildWorld('edge');
    b.fs.overlay('/home/edge', data);
    expect(b.fs.get('/home/edge/laboratorio/appunti/x.txt')).toMatchObject({ type: 'file', content: 'riga\n' });
    expect(b.fs.get('/home/edge/README.txt')!.perms).toBe('rw-------');
    // i file del gioco restano disponibili anche se aggiunti in versioni successive
    expect(b.fs.get('/home/edge/missioni/benvenuto.txt')).toBeDefined();
  });

  it('localFs resta il deck anche durante una sessione ssh', () => {
    const sh = buildWorld('edge');
    sh.run('ssh studente@lab.lan');
    expect(sh.host).toBe('lab');
    expect(sh.localFs.get('/home/edge/README.txt')).toBeDefined();
  });

  it('backup dei progressi: andata e ritorno, anche con caratteri speciali', () => {
    const save = { ...defaultSave(), handle: 'edge', xp: 1234, completed: ['ch01-m1', 'ch01-m2'], known: ['ls', 'cd'] };
    const sh = buildWorld('edge');
    sh.run('echo "è già così: ✔ ñ" > nota.txt');
    const deck = { home: sh.fs.serialize('/home/edge'), aliases: { ll: 'ls -la' } };
    const code = makeBackup(save, deck);
    expect(code.startsWith('NCB1:')).toBe(true);
    const back = parseBackup(` ${code.slice(0, 20)}\n${code.slice(20)} `)!;
    expect(back.save).toMatchObject({ handle: 'edge', xp: 1234, completed: ['ch01-m1', 'ch01-m2'] });
    const restored = buildWorld('edge');
    restored.fs.overlay('/home/edge', (back.deck as { home: unknown }).home);
    expect((restored.fs.get('/home/edge/nota.txt') as { content: string }).content).toBe('è già così: ✔ ñ\n');
  });

  it('un codice di backup non valido viene rifiutato', () => {
    expect(parseBackup('')).toBeNull();
    expect(parseBackup('NCB1:non-base64!!')).toBeNull();
    expect(parseBackup('NCB1:' + btoa('{"save":{"xp":"tanti"}}'))).toBeNull();
    expect(parseBackup('qualcosa')).toBeNull();
  });

  it('il salvataggio contiene solo ciò che il giocatore ha cambiato', () => {
    const base = buildWorld('edge');
    const sh = buildWorld('edge');
    sh.run('mkdir -p laboratorio/appunti');
    sh.run('echo "mio" > laboratorio/appunti/x.txt');
    sh.run('chmod 600 README.txt');
    sh.run('rm laboratorio/vecchio_log.txt');
    const { tree, deleted } = sh.fs.diffFrom(base.fs, '/home/edge');
    const json = JSON.stringify(tree);
    expect(json.length).toBeLessThan(900); // non i ~40.000 caratteri di tutta la home
    expect(json).not.toContain('cattura'); // file del gioco non toccati: assenti
    expect(deleted).toEqual(['/home/edge/laboratorio/vecchio_log.txt']);

    const fresh = buildWorld('edge');
    fresh.fs.overlay('/home/edge', JSON.parse(json));
    fresh.fs.removePaths(deleted);
    expect(fresh.fs.get('/home/edge/laboratorio/appunti/x.txt')).toMatchObject({ content: 'mio\n' });
    expect(fresh.fs.get('/home/edge/README.txt')!.perms).toBe('rw-------');
    expect(fresh.fs.get('/home/edge/laboratorio/vecchio_log.txt')).toBeUndefined();
    expect(fresh.fs.get('/home/edge/laboratorio/bozza.txt')).toBeDefined(); // il resto resta
  });

  it('senza modifiche il salvataggio è vuoto', () => {
    const base = buildWorld('edge');
    const sh = buildWorld('edge');
    const d = sh.fs.diffFrom(base.fs, '/home/edge');
    expect(d.tree).toBeNull();
    expect(d.deleted).toEqual([]);
  });
});
