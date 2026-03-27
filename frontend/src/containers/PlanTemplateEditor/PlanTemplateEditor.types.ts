import type { PlanTemplate } from '../../types';

export type EditorMode = { kind: 'idle' } | { kind: 'view'; template: PlanTemplate } | { kind: 'create' };
