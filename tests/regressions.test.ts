import { describe, expect, it } from 'vitest';
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
});
