import { it } from 'vitest';
import { allMissions } from '../src/content';
it('x', () => { const out = allMissions().filter(m=>m.id.startsWith('ch02')).map(m=> m.id+'\n  '+m.steps.map(s=>s.kind[0]+':'+s.title+(s.since?'('+s.since+')':'')).join('\n  ')).join('\n'); require('fs').writeFileSync('/tmp/claude-0/-home-user/318dce16-3d94-59e3-baa4-390ef5172e3d/scratchpad/ch02.txt', out); });
