import type { SummaryTabProps } from './SummaryTab.types';
import {
  Container,
  SectionTitle,
  SectionGap,
  Table,
  Row,
  LabelCell,
  ValueCell,
} from './SummaryTab.styles';

function formatBool(val: boolean): string {
  return val ? 'Yes' : 'No';
}

function formatValue(val: string | number | null | undefined): string {
  if (val == null) return '—';
  return String(val);
}

export function SummaryTab({ plan }: SummaryTabProps) {
  const { payout, payroll, disputes } = plan.config;

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

      <SectionGap />

      <SectionTitle>Payout</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Automatic payout</LabelCell>
          <ValueCell>{formatBool(payout.is_automatic_payout_enabled)}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Final payment offset</LabelCell>
          <ValueCell>{formatValue(payout.final_payment_offset)}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Draws enabled</LabelCell>
          <ValueCell>{formatBool(payout.is_draws_enabled)}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Draw frequency</LabelCell>
          <ValueCell>{formatValue(payout.draw_frequency)}</ValueCell>
        </Row>
      </Table>

      <SectionGap />

      <SectionTitle>Payroll</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Payout type</LabelCell>
          <ValueCell>{formatValue(payroll.payout_type)}</ValueCell>
        </Row>
      </Table>

      <SectionGap />

      <SectionTitle>Disputes</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Disputes enabled</LabelCell>
          <ValueCell>{formatBool(disputes.is_disputes_enabled)}</ValueCell>
        </Row>
      </Table>
    </Container>
  );
}
