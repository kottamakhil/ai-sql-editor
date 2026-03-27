import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  height: 100%;
`;

export const ListPanel = styled.div`
  width: 260px;
  min-width: 260px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fafafa;
`;

export const ListHeader = styled.div`
  padding: 20px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
`;

export const ListTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

export const NewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #1a1a2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #f9fafb; border-color: #9ca3af; }
  svg { width: 14px; height: 14px; }
`;

export const SkillList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

export const SkillItem = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  border: none;
  background: ${(p) => (p.$active ? '#fff' : 'transparent')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#374151')};
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  cursor: pointer;
  border-left: 3px solid ${(p) => (p.$active ? '#5b1647' : 'transparent')};
  &:hover { background: ${(p) => (p.$active ? '#fff' : '#f3f4f6')}; }
`;

export const EditorPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const EditorHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const EditorTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

export const SaveBtn = styled.button<{ $disabled?: boolean }>`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$disabled ? '#d1d5db' : '#5b1647')};
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  &:hover { background: ${(p) => (p.$disabled ? '#d1d5db' : '#4a1239')}; }
`;

export const EditorBody = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  display: block;
`;

export const NameInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #5b1647; box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1); }
  &:read-only { background: #f9fafb; color: #6b7280; }
`;

export const ContentEditor = styled.textarea`
  flex: 1;
  min-height: 300px;
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1a1a2e;
  resize: none;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #5b1647; box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1); }
  &:read-only { background: #f9fafb; color: #6b7280; }
`;

export const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 12px;
  padding: 48px;
  text-align: center;

  svg { width: 48px; height: 48px; color: #d1d5db; }
  h3 { font-size: 16px; font-weight: 500; color: #6b7280; margin: 0; }
  p { font-size: 13px; margin: 0; }
`;

export const StatusBar = styled.div`
  padding: 8px 24px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;
`;
