import styled from 'styled-components';

export const SidebarWrapper = styled.aside`
  width: 220px;
  min-width: 220px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  height: 100%;
  overflow-y: auto;
`;

export const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #9ca3af;
  padding: 0 20px;
  margin-bottom: 8px;
  margin-top: 20px;

  &:first-child {
    margin-top: 0;
  }
`;

export const NavItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? 500 : 400)};
  color: ${(p) => (p.$active ? '#fff' : '#374151')};
  background: ${(p) => (p.$active ? '#5B1647' : 'transparent')};
  border-radius: ${(p) => (p.$active ? '0' : '0')};
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$active ? '#5B1647' : '#f9fafb')};
  }
`;

export const NavBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.25);
  padding: 1px 8px;
  border-radius: 10px;
  color: inherit;
`;

export const EmployeeLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }

  svg {
    width: 16px;
    height: 16px;
    color: #9ca3af;
  }
`;

export const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 20px;
`;

export const StatRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
`;

export const StatLabel = styled.span`
  color: #6b7280;
`;

export const StatValue = styled.span`
  font-weight: 600;
  color: #1a1a2e;
`;
