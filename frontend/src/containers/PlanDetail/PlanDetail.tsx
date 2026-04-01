import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePlan } from '../../actions/plans';
import { SummaryTab } from '../../components/SummaryTab/SummaryTab';
import { ArtifactsTab } from '../../components/ArtifactsTab/ArtifactsTab';
import { isPayoutArtifact, isRecipientArtifact, sortArtifacts } from '../../utils/artifactLabels';

import { PlanSkillsTab } from '../../components/PlanSkillsTab';
import { LineageTab } from '../../components/LineageTab';
import { ChatPanel } from '../../components/ChatPanel/ChatPanel';
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
  const payoutArtifacts = useMemo(() => {
    if (!plan) return [];
    const filtered = plan.artifacts.filter((a) => !isRecipientArtifact(a.name));
    const sorted = sortArtifacts(filtered);
    return sorted.sort((a, b) => Number(isPayoutArtifact(b.name)) - Number(isPayoutArtifact(a.name)));
  }, [plan]);
  const recipientArtifacts = useMemo(() => {
    if (!plan) return [];
    return sortArtifacts(plan.artifacts.filter((a) => isRecipientArtifact(a.name)));
  }, [plan]);

  return (
    <PageContainer>
      <MainContent>
        {isLoading ? (
          <LoadingState>Loading plan...</LoadingState>
        ) : isError || !plan ? (
          <ErrorState>Failed to load plan.</ErrorState>
        ) : (
          <>
            <Breadcrumb>
              <PlanName>{plan.name}</PlanName>
              <StatusDot>Draft</StatusDot>
            </Breadcrumb>

            <TabBar>
              <Tab $active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
                Summary
              </Tab>
              <Tab $active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')}>
                Payouts
              </Tab>
              <Tab $active={activeTab === 'recipients'} onClick={() => setActiveTab('recipients')}>
                Recipients
              </Tab>

              <Tab $active={activeTab === 'skills'} onClick={() => setActiveTab('skills')}>
                Plan skills
              </Tab>
              <Tab $active={activeTab === 'lineage'} onClick={() => setActiveTab('lineage')}>
                Lineage
              </Tab>
            </TabBar>

            <TabContent>
              {activeTab === 'summary' && <SummaryTab plan={plan} planId={planId!} />}
              {activeTab === 'payouts' && (
                <ArtifactsTab
                  artifacts={payoutArtifacts}
                  planId={planId!}
                  cycles={plan.cycles}
                />
              )}
              {activeTab === 'recipients' && (
                <ArtifactsTab
                  artifacts={recipientArtifacts}
                  planId={planId!}
                  cycles={plan.cycles}
                />
              )}

              {activeTab === 'skills' && <PlanSkillsTab skills={plan.skills} />}
              {activeTab === 'lineage' && <LineageTab planId={planId!} />}
            </TabContent>
          </>
        )}
      </MainContent>

      <ChatPanel key={planId} planId={planId!} />
    </PageContainer>
  );
}
