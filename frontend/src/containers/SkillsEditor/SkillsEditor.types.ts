import type { Skill } from '../../types';

export type EditorMode = { kind: 'idle' } | { kind: 'view'; skill: Skill } | { kind: 'create' };
