import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEmployee, useEmployeePayouts } from '../../actions/employees';
import type { PayoutItem } from '../../types';
import {
  PageContainer,
  Header,
  Avatar,
  HeaderInfo,
  SummaryRow,
  SummaryCard,
  TabBar,
  Tab,
  PayoutsList,
  PayoutCard,
  PayoutCardHeader,
  PayoutName,
  PayoutAmount,
  StatusBadge,
  PayoutDate,
  StatusDot,
  EmptyState,
  LoadingState,
} from './EmployeePayouts.styles';

type TabId = 'all' | 'upcoming' | 'history';

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

function statusLabel(status: string): string {
  return status === 'paid' ? 'Paid' : 'Scheduled';
}

export function EmployeePayouts() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { data: employee, isLoading: empLoading } = useEmployee(employeeId ?? '');
  const { data: payoutsData, isLoading: payoutsLoading } = useEmployeePayouts(employeeId ?? '');
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const allPayouts = useMemo(() => {
    if (!payoutsData) return [];
    const result: (PayoutItem & { groupName: string; installment: string })[] = [];
    for (const [groupId, group] of Object.entries(payoutsData.groups)) {
      group.payouts.forEach((p, idx) => {
        result.push({
          ...p,
          groupName: groupId,
          installment: `${idx + 1} of ${group.payouts.length}`,
        });
      });
    }
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }, [payoutsData]);

  const filteredPayouts = useMemo(() => {
    if (activeTab === 'all') return allPayouts;
    if (activeTab === 'history') return allPayouts.filter((p) => p.status === 'paid');
    return allPayouts.filter((p) => p.status === 'scheduled');
  }, [allPayouts, activeTab]);

  const summary = useMemo(() => {
    const upcoming = allPayouts.filter((p) => p.status === 'scheduled').reduce((s, p) => s + p.amount, 0);
    const received = allPayouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const scheduledCount = allPayouts.filter((p) => p.status === 'scheduled').length;
    return { upcoming, received, scheduledCount };
  }, [allPayouts]);

  const tabCounts = useMemo(() => ({
    all: allPayouts.length,
    upcoming: allPayouts.filter((p) => p.status === 'scheduled').length,
    history: allPayouts.filter((p) => p.status === 'paid').length,
  }), [allPayouts]);

  if (empLoading || payoutsLoading) {
    return <LoadingState>Loading compensation data...</LoadingState>;
  }

  if (!employee) {
    return <EmptyState>Employee not found</EmptyState>;
  }

  return (
    <PageContainer>
      <Header>
        <Avatar>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Avatar>
        <HeaderInfo>
          <h1>My Compensation</h1>
          <p>{employee.name} &middot; {employee.role} &middot; {employee.department}</p>
        </HeaderInfo>
      </Header>

      <SummaryRow>
        <SummaryCard>
          <div className="value">{formatCurrency(summary.upcoming)}</div>
          <div className="label">Upcoming Payments</div>
        </SummaryCard>
        <SummaryCard>
          <div className="value">{formatCurrency(summary.received)}</div>
          <div className="label">Received to Date</div>
        </SummaryCard>
        <SummaryCard>
          <div className="value">{summary.scheduledCount}</div>
          <div className="label">Scheduled</div>
        </SummaryCard>
      </SummaryRow>

      <TabBar>
        {(['all', 'upcoming', 'history'] as const).map((tab) => (
          <Tab key={tab} $active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab === 'all' ? 'All' : tab === 'upcoming' ? 'Upcoming' : 'History'} ({tabCounts[tab]})
          </Tab>
        ))}
      </TabBar>

      {filteredPayouts.length === 0 ? (
        <EmptyState>No payouts to display</EmptyState>
      ) : (
        <PayoutsList>
          {filteredPayouts.map((p) => (
            <PayoutCard key={p.payout_id}>
              <StatusDot $status={p.status} />
              <PayoutCardHeader>
                <PayoutName>
                  <span className="name">{p.groupName}</span>
                  <span className="installment">{p.installment}</span>
                </PayoutName>
                <PayoutAmount>
                  <div className="amount">{formatCurrency(p.amount)}</div>
                  <StatusBadge $status={p.status}>{statusLabel(p.status)}</StatusBadge>
                </PayoutAmount>
              </PayoutCardHeader>
              <PayoutDate>
                {p.status === 'paid' ? 'Paid' : 'Scheduled for'} {formatDate(p.date)}
              </PayoutDate>
            </PayoutCard>
          ))}
        </PayoutsList>
      )}
    </PageContainer>
  );
}
