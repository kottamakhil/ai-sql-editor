import styled from 'styled-components';
import type { Plan } from '../types';

const Container = styled.div`
  padding: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px;
`;

const Table = styled.div`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const Row = styled.div`
  display: contents;

  &:not(:last-child) > * {
    border-bottom: 1px solid #e5e7eb;
  }
`;

const LabelCell = styled.div`
  padding: 12px 16px;
  font-size: 13px;
  color: #6b7280;
  background: #f9fafb;
  font-weight: 500;
`;

const ValueCell = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  color: #1a1a2e;
`;

interface SummaryTabProps {
  plan: Plan;
}

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
