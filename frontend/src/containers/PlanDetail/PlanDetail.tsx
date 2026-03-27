import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePlan } from '../../actions/plans';
import { SummaryTab } from '../../components/SummaryTab';
import { ArtifactsTab } from '../../components/ArtifactsTab';
import { ChatPanel } from '../../components/ChatPanel';
import type { TabId } from './PlanDetail.types';
import {
  PageContainer,
  MainContent,
  Breadcrumb,
  PlanName,
  StatusDot,
  TabBar,
  Tab,
  TabContent,
  LoadingState,
  ErrorState,
} from './PlanDetail.styles';

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
