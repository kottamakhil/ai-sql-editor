import type { SummaryTabProps } from './SummaryTab.types';
import {
  Container,
  SectionTitle,
  Table,
  Row,
  LabelCell,
  ValueCell,
} from './SummaryTab.styles';

export function SummaryTab({ plan }: SummaryTabProps) {
  return (
    <Container>
      <SectionTitle>Plan details</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Plan name</LabelCell>
          <ValueCell>{plan.name}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Type</LabelCell>
          <ValueCell>{plan.plan_type}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Frequency</LabelCell>
          <ValueCell>{plan.frequency}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Mode</LabelCell>
          <ValueCell>{plan.mode}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Artifacts</LabelCell>
          <ValueCell>{plan.artifacts.length} artifact{plan.artifacts.length !== 1 ? 's' : ''}</ValueCell>
        </Row>
      </Table>
    </Container>
  );
}
