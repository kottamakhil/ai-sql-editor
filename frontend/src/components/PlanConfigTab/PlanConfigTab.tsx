import { useMemo } from 'react';
import type { PlanConfigTabProps } from './PlanConfigTab.types';
import { Container, EditorHeader, HeaderTitle, JsonEditor } from './PlanConfigTab.styles';

function planToConfig(plan: PlanConfigTabProps['plan']) {
  return {
    name: plan.name,
    plan_type: plan.plan_type,
    frequency: plan.frequency,
    mode: plan.mode,
    artifacts: plan.artifacts.map((a) => ({
      name: a.name,
      sql_expression: a.sql_expression,
    })),
  };
}

export function PlanConfigTab({ plan }: PlanConfigTabProps) {
  const json = useMemo(
    () => JSON.stringify(planToConfig(plan), null, 2),
    [plan],
  );

  return (
    <Container>
      <EditorHeader>
        <HeaderTitle>Plan Configuration</HeaderTitle>
      </EditorHeader>
      <JsonEditor value={json} readOnly spellCheck={false} />
    </Container>
  );
}
