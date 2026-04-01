import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MOCK_NAV_BADGES } from '../../mockservice';
import { useAppContext } from '../../contexts/AppContext';
import { usePlans } from '../../actions/plans';
import { NewPlanChatModal } from '../NewPlanChatModal/NewPlanChatModal';
import { useEmployees } from '../../actions/employees';
import { PanelIcon, ApprovalsIcon, DisputesIcon, WorkspacesIcon, SkillsIcon, TemplatesIcon, EmployeesIcon } from './Sidebar.helpers';
import {
  SidebarContainer,
  ExpandedContent,
  CollapsedContent,
  CollapsedIconButton,
  SidebarTop,
  NewPlanRow,
  NewPlanButton,
  SquareButton,
  SearchInput,
  NavSection,
  NavItem,
  Badge,
  SectionTitle,
  PlansList,
  PlanItem,
  SidebarFooter,
  FooterItem,
  SkeletonLine,
} from './Sidebar.styles';

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const [showNewPlan, setShowNewPlan] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ planId: string; employeeId: string }>();
  const activePlanId = params.planId;
  const activeEmployeeId = params.employeeId;
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: employees, isLoading: employeesLoading } = useEmployees();

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
            <NavItem onClick={() => navigate('/variable-compensation/plan-templates')}>
              <TemplatesIcon />
              Plan templates
            </NavItem>
          </NavSection>

          <SectionTitle>Employees</SectionTitle>
          <PlansList>
            {employeesLoading && (
              <>
                <SkeletonLine $width="75%" />
                <SkeletonLine $width="60%" />
                <SkeletonLine $width="50%" />
              </>
            )}
            {!employeesLoading && (employees ?? []).map((emp) => (
              <PlanItem
                key={emp.employee_id}
                $active={emp.employee_id === activeEmployeeId}
                onClick={() => navigate(`/compensation/employees/${emp.employee_id}`)}
              >
                {emp.name}
              </PlanItem>
            ))}
            {!employeesLoading && employees?.length === 0 && (
              <PlanItem as="div" style={{ color: '#9ca3af', cursor: 'default' }}>
                No employees yet
              </PlanItem>
            )}
          </PlansList>

          <SectionTitle>Recent plans</SectionTitle>
          <PlansList>
            {plansLoading && (
              <>
                <SkeletonLine $width="75%" />
                <SkeletonLine $width="60%" />
                <SkeletonLine $width="85%" />
                <SkeletonLine $width="50%" />
                <SkeletonLine $width="70%" />
              </>
            )}
            {!plansLoading && (plans ?? []).map((plan) => (
              <PlanItem
                key={plan.plan_id}
                $active={plan.plan_id === activePlanId}
                onClick={() => navigate(`/variable-compensation/plans/${plan.plan_id}`)}
              >
                {plan.name}
              </PlanItem>
            ))}
            {!plansLoading && plans?.length === 0 && (
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
          <CollapsedIconButton title="Plan Templates" onClick={() => navigate('/variable-compensation/plan-templates')}>
            <TemplatesIcon />
          </CollapsedIconButton>
          <CollapsedIconButton title="Employees" onClick={() => navigate('/compensation/employees')}>
            <EmployeesIcon />
          </CollapsedIconButton>
        </CollapsedContent>
      )}
    </SidebarContainer>
    {showNewPlan && <NewPlanChatModal onClose={() => setShowNewPlan(false)} />}
    </>
  );
}
