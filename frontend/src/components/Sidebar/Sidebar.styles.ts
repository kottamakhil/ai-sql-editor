import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const SkeletonLine = styled.div<{ $width?: string }>`
  height: 14px;
  width: ${(p) => p.$width ?? '100%'};
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  margin: 4px 16px;
`;

export const SidebarContainer = styled.aside<{ $open: boolean }>`
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

export const ExpandedContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 260px;
  overflow: hidden;
`;

export const CollapsedContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 4px;
  min-width: 48px;
`;

export const CollapsedIconButton = styled.button`
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

export const SidebarTop = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
`;

export const NewPlanRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const NewPlanButton = styled.button`
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

export const SquareButton = styled.button`
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

export const SearchInput = styled.div`
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

export const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

export const NavItem = styled.button`
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

export const Badge = styled.span`
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

export const SectionTitle = styled.div`
  padding: 16px 16px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: capitalize;
  flex-shrink: 0;
`;

export const PlansList = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
`;

export const PlanItem = styled.button<{ $active?: boolean }>`
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

export const SidebarFooter = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 8px 0;
  flex-shrink: 0;
`;

export const FooterItem = styled.button`
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
