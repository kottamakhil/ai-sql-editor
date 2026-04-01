import {
  SidebarWrapper,
  SectionLabel,
  NavItem,
  NavBadge,
  EmployeeLink,
  StatsGrid,
  StatRow,
  StatLabel,
  StatValue,
} from './CompensationSidebar.styles';

export function CompensationSidebar() {
  return (
    <SidebarWrapper>
      <SectionLabel>Admin</SectionLabel>
      <NavItem $active>
        New Hire Sign-On
      </NavItem>
      <NavItem>
        Payment Obligations
        <NavBadge>12</NavBadge>
      </NavItem>

      <SectionLabel>Employee Preview</SectionLabel>
      <EmployeeLink>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" />
        </svg>
        Sarah Chen's View
      </EmployeeLink>

      <SectionLabel>Quick Stats</SectionLabel>
      <StatsGrid>
        <StatRow>
          <StatLabel>Outstanding</StatLabel>
          <StatValue>$897,320</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Needs attention</StatLabel>
          <StatValue>5</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Ready for payroll</StatLabel>
          <StatValue>3</StatValue>
        </StatRow>
      </StatsGrid>
    </SidebarWrapper>
  );
}
