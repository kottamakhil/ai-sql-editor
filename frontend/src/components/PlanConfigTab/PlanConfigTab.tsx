import type { PlanConfigTabProps } from './PlanConfigTab.types';
import { Container, EditorHeader, HeaderTitle, JsonEditor } from './PlanConfigTab.styles';

export function PlanConfigTab({ plan }: PlanConfigTabProps) {
  const yaml = plan.inferred_config || 'No inferred configuration available yet.';

  return (
    <Container>
      <EditorHeader>
        <HeaderTitle>Plan Configuration (YAML)</HeaderTitle>
      </EditorHeader>
      <JsonEditor value={yaml} readOnly spellCheck={false} />
    </Container>
  );
}
