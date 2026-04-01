import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ViewToggle = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 2px;
  gap: 2px;
`;

export const ViewToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: none;
  border-radius: 999px;
  background: ${(p) => (p.$active ? '#fff' : 'transparent')};
  box-shadow: ${(p) => (p.$active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#9ca3af')};
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  margin-left: 4px;

  &:hover {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const TakeoverOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const TakeoverModal = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 960px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

export const TakeoverHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  gap: 4px;
`;

export const TakeoverTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TakeoverPlanName = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

export const TakeoverNavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const TakeoverCounter = styled.span`
  font-size: 13px;
  color: #9ca3af;
  min-width: 24px;
  text-align: center;
`;

export const NavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: none;
  color: #9ca3af;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const TakeoverArtifactName = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
`;

export const TakeoverToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

export const FilterInput = styled.input`
  padding: 6px 12px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  color: #1a1a2e;
  width: 200px;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1);
  }
`;

export const TakeoverBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
`;

export const TakeoverCloseBtn = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const TakeoverConfigEditor = styled.pre`
  width: 100%;
  min-height: 400px;
  padding: 20px;
  margin: 0;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  border-radius: 8px;
  box-sizing: border-box;
  tab-size: 2;
  overflow: auto;
  white-space: pre;
`;

export const ConfigEditor = styled.pre`
  width: 100%;
  min-height: 300px;
  padding: 16px;
  margin: 0;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  border-radius: 8px;
  box-sizing: border-box;
  tab-size: 2;
  overflow-x: auto;
  white-space: pre;
`;

export const EditIconBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: #9ca3af;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #5b1647;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Table = styled.div<{ $noBorder?: boolean }>`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0;
  border: ${(p) => (p.$noBorder === false ? '1px solid #e5e7eb' : 'none')};
  border-radius: ${(p) => (p.$noBorder === false ? '8px' : '0')};

  & > *:first-child { border-top-left-radius: 8px; }
  & > *:nth-child(2) { border-top-right-radius: 8px; }
  & > *:nth-last-child(2) { border-bottom-left-radius: 8px; }
  & > *:last-child { border-bottom-right-radius: 8px; }
`;

export const Row = styled.div`
  display: contents;

  &:not(:last-child) > * {
    border-bottom: 1px solid #e5e7eb;
  }
`;

export const LabelCell = styled.div`
  padding: 12px 16px;
  font-size: 13px;
  color: #6b7280;
  background: #f9fafb;
  font-weight: 500;
`;

export const ValueCell = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  color: #1a1a2e;
`;

export const SectionGap = styled.div`
  height: 32px;
`;

export const EditableValueCell = styled.div`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const InlineInput = styled.input`
  flex: 1;
  padding: 4px 8px;
  font-size: 14px;
  color: #1a1a2e;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  background: #fff;

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1);
  }
`;

export const InlineNumberInput = styled.input.attrs({ type: 'number' })`
  width: 100px;
  padding: 4px 8px;
  font-size: 14px;
  color: #1a1a2e;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  background: #fff;

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

export const DropdownWrapper = styled.div`
  flex: 1;
  position: relative;
`;

export const DropdownTrigger = styled.button<{ $open?: boolean }>`
  width: 100%;
  padding: 6px 32px 6px 10px;
  font-size: 14px;
  color: #1a1a2e;
  border: 1px solid ${(p) => (p.$open ? '#5b1647' : '#d1d5db')};
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  background: #fff;
  cursor: pointer;
  text-align: left;
  position: relative;
  box-shadow: ${(p) => (p.$open ? '0 0 0 2px rgba(91, 22, 71, 0.1)' : 'none')};

  &:hover {
    border-color: ${(p) => (p.$open ? '#5b1647' : '#9ca3af')};
  }

  svg {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%) ${(p) => (p.$open ? 'rotate(180deg)' : 'rotate(0)')};
    width: 14px;
    height: 14px;
    color: #6b7280;
    transition: transform 0.15s ease;
  }
`;

export const DropdownMenu = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
`;

export const DropdownItem = styled.li<{ $active?: boolean }>`
  padding: 8px 12px;
  font-size: 14px;
  color: ${(p) => (p.$active ? '#5b1647' : '#1a1a2e')};
  background: ${(p) => (p.$active ? '#fdf2f8' : 'transparent')};
  font-weight: ${(p) => (p.$active ? '500' : '400')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &:hover {
    background: ${(p) => (p.$active ? '#fdf2f8' : '#f3f4f6')};
  }

  svg {
    width: 14px;
    height: 14px;
    color: #5b1647;
    flex-shrink: 0;
  }
`;

export const SaveBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

export const SaveBtn = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$variant === 'secondary' ? '#d1d5db' : '#5b1647')};
  background: ${(p) => (p.$variant === 'secondary' ? '#fff' : '#5b1647')};
  color: ${(p) => (p.$variant === 'secondary' ? '#374151' : '#fff')};

  &:hover {
    background: ${(p) => (p.$variant === 'secondary' ? '#f3f4f6' : '#4a1239')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const DataTable = styled.table<{ $noBorder?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: ${(p) => (p.$noBorder === false ? '1px solid #e5e7eb' : 'none')};
  border-radius: ${(p) => (p.$noBorder === false ? '8px' : '0')};
  overflow: hidden;

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
    white-space: nowrap;
  }

  th {
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    background: #f9fafb;
    position: sticky;
    top: 0;
  }

  td {
    color: #374151;
  }
`;

export const DataLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9ca3af;
  font-size: 14px;
`;

export const DataError = styled.div`
  padding: 16px 20px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  border-radius: 8px;
`;

export const DataFooter = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  color: #9ca3af;
  border-top: 1px solid #e5e7eb;
`;
