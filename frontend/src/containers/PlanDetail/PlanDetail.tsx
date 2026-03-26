import { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { usePlan } from '../../actions/plans';
import { SummaryTab } from '../../components/SummaryTab';
import { ArtifactsTab } from '../../components/ArtifactsTab';
import { ChatPanel } from '../../components/ChatPanel';

const PageContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Breadcrumb = styled.div`
  padding: 12px 24px;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
`;

const PlanName = styled.span`
  color: #1a1a2e;
  font-weight: 500;
`;

const StatusDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
  }
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => (p.$active ? '#1a1a2e' : '#6b7280')};
  cursor: pointer;
  border-bottom: 2px solid ${(p) => (p.$active ? '#5b1647' : 'transparent')};
  margin-bottom: -1px;

  &:hover {
    color: #1a1a2e;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-size: 14px;
`;

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #dc2626;
  font-size: 14px;
`;

type TabId = 'summary' | 'artifacts';

export function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading, isError } = usePlan(planId!);
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  if (isLoading) {
    return <LoadingState>Loading plan...</LoadingState>;
  }

  if (isError || !plan) {
    return <ErrorState>Failed to load plan.</ErrorState>;
  }

  return (
    <PageContainer>
      <MainContent>
        <Breadcrumb>
          <PlanName>{plan.name}</PlanName>
          <StatusDot>Draft</StatusDot>
        </Breadcrumb>

        <TabBar>
          <Tab $active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
            Summary
          </Tab>
          <Tab $active={activeTab === 'artifacts'} onClick={() => setActiveTab('artifacts')}>
            Artifacts
          </Tab>
        </TabBar>

        <TabContent>
          {activeTab === 'summary' && <SummaryTab plan={plan} />}
          {activeTab === 'artifacts' && <ArtifactsTab artifacts={plan.artifacts} planId={planId!} />}
        </TabContent>
      </MainContent>

      <ChatPanel planId={planId!} />
    </PageContainer>
  );
}
