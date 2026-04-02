import { useState } from 'react';
import {
  usePaymentObligations,
  type ObligationEmployee,
  type ObligationPayout,
} from '../../actions/employees';
import {
  PageContainer,
  PageHeader,
  SummaryRow,
  SummaryCard,
  TableWrapper,
  TableHeader,
  EmployeeRow,
  EmployeeHeader,
  EmployeeInfo,
  ExpandIcon,
  EmployeeAvatar,
  EmployeeNameBlock,
  StatCell,
  PayoutRows,
  PayoutRow,
  PayoutType,
  StatusBadge,
  EmptyState,
  LoadingState,
} from './PaymentObligations.styles';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupPayouts(payouts: ObligationPayout[]) {
  const groups: Record<string, ObligationPayout[]> = {};
  for (const p of payouts) {
    (groups[p.group_id] ??= []).push(p);
  }
  return groups;
}

function EmployeeSection({ employee }: { employee: ObligationEmployee }) {
  const [expanded, setExpanded] = useState(false);
  const grouped = groupPayouts(employee.payouts);

  return (
    <EmployeeRow $expanded={expanded}>
      <EmployeeHeader $expanded={expanded} onClick={() => setExpanded((e) => !e)}>
        <EmployeeInfo>
          <ExpandIcon $expanded={expanded}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ExpandIcon>
          <EmployeeAvatar>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </EmployeeAvatar>
          <EmployeeNameBlock>
            <div className="name">{employee.name}</div>
            <div className="detail">{employee.role} &middot; {employee.department}</div>
          </EmployeeNameBlock>
        </EmployeeInfo>
        <StatCell>{employee.obligation_count} obligation{employee.obligation_count !== 1 ? 's' : ''}</StatCell>
        <StatCell>{formatCurrency(employee.outstanding)} outstanding</StatCell>
        <StatCell>{formatCurrency(employee.paid)} paid</StatCell>
      </EmployeeHeader>

      {expanded && (
        <PayoutRows>
          {Object.entries(grouped).flatMap(([groupId, payouts]) =>
            payouts.map((p, idx) => (
              <PayoutRow key={p.payout_id}>
                <PayoutType>
                  {groupId}
                  {payouts.length > 1 && (
                    <span className="installment">{idx + 1} of {payouts.length}</span>
                  )}
                </PayoutType>
                <div>{formatCurrency(p.amount)}</div>
                <div>{formatDate(p.date)}</div>
                <StatusBadge $status={p.status}>
                  {p.status === 'paid' ? 'Paid' : 'Scheduled'}
                </StatusBadge>
                <div>Offer Acceptance</div>
              </PayoutRow>
            )),
          )}
        </PayoutRows>
      )}
    </EmployeeRow>
  );
}

export function PaymentObligations() {
  const { data, isLoading } = usePaymentObligations();

  if (isLoading) {
    return <LoadingState>Loading payment obligations...</LoadingState>;
  }

  if (!data || data.employees.length === 0) {
    return (
      <PageContainer>
        <PageHeader>
          <h1>Payment Obligations</h1>
          <p>All scheduled, pending, and completed payment obligations across the company.</p>
        </PageHeader>
        <EmptyState>No payment obligations found</EmptyState>
      </PageContainer>
    );
  }

  const { summary, employees } = data;

  return (
    <PageContainer>
      <PageHeader>
        <h1>Payment Obligations</h1>
        <p>All scheduled, pending, and completed payment obligations across the company.</p>
      </PageHeader>

      <SummaryRow>
        <SummaryCard>
          <div className="value">{formatCurrency(summary.total_outstanding)}</div>
          <div className="label">Outstanding</div>
        </SummaryCard>
        <SummaryCard $accent="#ea580c">
          <div className="value">{summary.scheduled_count}</div>
          <div className="label">Scheduled</div>
        </SummaryCard>
        <SummaryCard $accent="#16a34a">
          <div className="value">{summary.paid_count}</div>
          <div className="label">Paid</div>
        </SummaryCard>
        <SummaryCard>
          <div className="value">{formatCurrency(summary.total_paid)}</div>
          <div className="label">Total Paid</div>
        </SummaryCard>
      </SummaryRow>

      <TableWrapper>
        <TableHeader>
          <div>Employee</div>
          <div>Type</div>
          <div>Amount</div>
          <div>Target Date</div>
          <div>Status</div>
          <div>Source</div>
        </TableHeader>
        {employees.map((emp) => (
          <EmployeeSection key={emp.employee_id} employee={emp} />
        ))}
      </TableWrapper>
    </PageContainer>
  );
}
