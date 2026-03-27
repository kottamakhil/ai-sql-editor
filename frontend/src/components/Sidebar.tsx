import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { MOCK_NAV_BADGES } from '../mockservice';
import { useAppContext } from '../contexts/AppContext';
import { usePlans } from '../actions/plans';
import { NewPlanChatModal } from './NewPlanChatModal';

const SidebarContainer = styled.aside<{ $open: boolean }>`
  width: ${(p) => (p.$open ? '260px' : '48px')};
  min-width: ${(p) => (p.$open ? '260px' : '48px')};
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  overflow: hidden;
  transition: width 0.2s ease, min-width 0.2s ease;
`;

const ExpandedContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 260px;
  overflow: hidden;
`;

const CollapsedContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 4px;
  min-width: 48px;
`;

const CollapsedIconButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: none;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SidebarTop = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
`;

const NewPlanRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NewPlanButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SquareButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 13px;

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  input {
    border: none;
    outline: none;
    font-size: 13px;
    color: #1a1a2e;
    width: 100%;
    background: transparent;

    &::placeholder {
      color: #9ca3af;
    }
  }
`;

const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  width: 100%;

  &:hover {
    background: #f3f4f6;
  }

  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
  }
`;

const Badge = styled.span`
  margin-left: auto;
  background: #e53e3e;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const SectionTitle = styled.div`
  padding: 16px 16px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: capitalize;
  flex-shrink: 0;
`;

const PlansList = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
`;

const PlanItem = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 16px;
  border: none;
  background: ${(p) => (p.$active ? '#f3f4f6' : 'none')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#374151')};
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;

  &:hover {
    background: #f3f4f6;
  }
`;

const SidebarFooter = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 8px 0;
  flex-shrink: 0;
`;

const FooterItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: #f3f4f6;
  }

  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
  }
`;

const PanelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const ApprovalsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const DisputesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
  </svg>
);

const WorkspacesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const SkillsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const [showNewPlan, setShowNewPlan] = useState(false);
  const navigate = useNavigate();
  const { planId: activePlanId } = useParams<{ planId: string }>();
  const { data: plans } = usePlans();

  return (
    <>
    <SidebarContainer $open={sidebarOpen}>
      {sidebarOpen ? (
        <ExpandedContent>
          <SidebarTop>
            <NewPlanRow>
              <NewPlanButton onClick={() => setShowNewPlan(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                New plan
              </NewPlanButton>
              <SquareButton title="Collapse sidebar" onClick={() => setSidebarOpen(false)}>
                <PanelIcon />
              </SquareButton>
            </NewPlanRow>

            <SearchInput>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input type="text" placeholder="Search plans..." />
            </SearchInput>
          </SidebarTop>

          <NavSection>
            <NavItem>
              <ApprovalsIcon />
              Approvals
              <Badge>{MOCK_NAV_BADGES.approvals}</Badge>
            </NavItem>
            <NavItem>
              <DisputesIcon />
              Disputes
              <Badge>{MOCK_NAV_BADGES.disputes}</Badge>
            </NavItem>
            <NavItem>
              <WorkspacesIcon />
              Workspaces
            </NavItem>
            <NavItem onClick={() => navigate('/variable-compensation/skills')}>
              <SkillsIcon />
              Skills
            </NavItem>
          </NavSection>

          <SectionTitle>Recent plans</SectionTitle>
          <PlansList>
            {(plans ?? []).map((plan) => (
              <PlanItem
                key={plan.plan_id}
                $active={plan.plan_id === activePlanId}
                onClick={() => navigate(`/variable-compensation/plans/${plan.plan_id}`)}
              >
                {plan.name}
              </PlanItem>
            ))}
            {plans?.length === 0 && (
              <PlanItem as="div" style={{ color: '#9ca3af', cursor: 'default' }}>
                No plans yet
              </PlanItem>
            )}
          </PlansList>

          <SidebarFooter>
            <FooterItem>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
              Knowledge Center
            </FooterItem>
            <FooterItem>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Access and Policies
            </FooterItem>
          </SidebarFooter>
        </ExpandedContent>
      ) : (
        <CollapsedContent>
          <CollapsedIconButton title="Expand sidebar" onClick={() => setSidebarOpen(true)}>
            <PanelIcon />
          </CollapsedIconButton>
          <CollapsedIconButton title="Approvals">
            <ApprovalsIcon />
          </CollapsedIconButton>
          <CollapsedIconButton title="Disputes">
            <DisputesIcon />
          </CollapsedIconButton>
          <CollapsedIconButton title="Workspaces">
            <WorkspacesIcon />
          </CollapsedIconButton>
          <CollapsedIconButton title="Skills" onClick={() => navigate('/variable-compensation/skills')}>
            <SkillsIcon />
          </CollapsedIconButton>
        </CollapsedContent>
      )}
    </SidebarContainer>
    {showNewPlan && <NewPlanChatModal onClose={() => setShowNewPlan(false)} />}
    </>
  );
}
