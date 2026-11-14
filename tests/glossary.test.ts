import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/content/glossary';

describe('glossario', () => {
  it('ogni voce è unica e ha una definizione', () => {
    const forms = GLOSSARY.flatMap((e) => [e.term, ...(e.aliases ?? [])].map((f) => f.toLowerCase()));
    const dup = forms.filter((f, i) => forms.indexOf(f) !== i);
    expect(dup).toEqual([]);
    for (const e of GLOSSARY) expect(e.def.length, e.term).toBeGreaterThan(20);
  });
});
