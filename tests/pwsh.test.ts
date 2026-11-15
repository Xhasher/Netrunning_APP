import { describe, expect, it } from 'vitest';
import '../src/content';
import { buildWorld } from '../src/content/world';
import { psCompletions } from '../src/engine/pwsh';

const comp = (sh: ReturnType<typeof buildWorld>, line: string) => {
  const r = psCompletions(sh, line);
  return r.items.map((i) => r.prefix + i);
};

describe('PowerShell', () => {
  it('pipeline di oggetti: filtra, ordina, conta', () => {
    const sh = buildWorld('edge');
    sh.run('pwsh');
    expect(sh.ps).toBe(true);
    const out = (c: string) => sh.run(c).lines.map((l) => l.text).join('\n');
    expect(out('Get-Content windows/security.csv | Select-String 4625 | Measure-Object')).toMatch(/\b8\b/);
    expect(out("Get-ChildItem -Recurse -Filter *.log | Sort-Object Length -Descending | Select-Object -First 1 -ExpandProperty Name")).toBe('auth.log');
    expect(out('Get-Foo')).toContain('not recognized');
    sh.run('exit');
    expect(sh.ps).toBe(false);
  });

  it('Tab completa cmdlet, alias, parametri, valori e percorsi', () => {
    const sh = buildWorld('edge');
    sh.run('pwsh');
    expect(comp(sh, 'Get-Proc')).toEqual(['Get-Process']);
    expect(comp(sh, 'get-ch')).toEqual(['Get-ChildItem']);
    expect(comp(sh, 'Get-ChildItem | Sort-O')).toEqual(['Get-ChildItem | Sort-Object']);
    expect(comp(sh, 'Get-ChildItem -Rec')).toEqual(['Get-ChildItem -Recurse']);
    expect(comp(sh, 'Get-ChildItem -F')).toEqual(['Get-ChildItem -File', 'Get-ChildItem -Filter', 'Get-ChildItem -Force']);
    expect(comp(sh, 'Enter-PSSession -ComputerName pc')).toEqual(['Enter-PSSession -ComputerName PC-AMM-07']);
    expect(comp(sh, 'Get-Content wind')).toEqual(['Get-Content ./windows/']);
    expect(comp(sh, 'Get-Content windows/sec')).toEqual(['Get-Content windows/security.csv']);
    sh.run('Enter-PSSession -ComputerName PC-AMM-07');
    expect(comp(sh, 'Get-ScheduledTask -TaskName One')).toEqual(["Get-ScheduledTask -TaskName 'OneDrive Standalone Update Task'", 'Get-ScheduledTask -TaskName OneDriveSync']);
    expect(comp(sh, 'Get-LocalGroupMember -Group adm')).toEqual(['Get-LocalGroupMember -Group Administrators']);
    expect(comp(sh, 'Get-Content C:\\Users\\r.costa\\Down')).toEqual(['Get-Content C:\\Users\\r.costa\\Downloads\\']);
  });
});
