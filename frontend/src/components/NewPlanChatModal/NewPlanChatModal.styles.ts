import styled, { keyframes } from 'styled-components';

export const thinScrollbar = `
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

export const Modal = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 640px;
  max-width: 90vw;
  height: 80vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

export const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: none;
  color: #6b7280;
  cursor: pointer;
  &:hover { background: #f3f4f6; color: #374151; }
  svg { width: 16px; height: 16px; }
`;

export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  ${thinScrollbar}
`;

export const WelcomeHint = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;

  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #6b7280;
    margin: 0 0 8px;
  }
  p { margin: 0; }
`;

export const MessageBubble = styled.div<{ $role: string }>`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  margin-bottom: 12px;
  align-self: ${(p) => (p.$role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${(p) => (p.$role === 'user' ? '#1a1a2e' : '#fff')};
  color: ${(p) => (p.$role === 'user' ? '#fff' : '#1a1a2e')};
  border: ${(p) => (p.$role === 'user' ? 'none' : '1px solid #e5e7eb')};
  white-space: ${(p) => (p.$role === 'user' ? 'pre-wrap' : 'normal')};

  p { margin: 0 0 8px; &:last-child { margin-bottom: 0; } }
  ul, ol { margin: 4px 0 8px; padding-left: 20px; }
  li { margin: 2px 0; }
  strong { font-weight: 600; }
  code {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    background: ${(p) => (p.$role === 'user' ? 'rgba(255,255,255,0.15)' : '#f3f4f6')};
  }
`;

export const ThinkingIndicator = styled.div`
  align-self: flex-start;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  span {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  span > i {
    font-style: normal;
    animation: pulse 1.4s ease-in-out infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

export const ClarificationWrapper = styled.div`
  align-self: flex-start;
  width: 100%;
  margin-bottom: 12px;
`;

export const InputArea = styled.div`
  padding: 12px 24px 20px;
  border-top: 1px solid #e5e7eb;
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 14px;
  background: #fff;
`;

export const Textarea = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a2e;
  line-height: 1.5;
  min-height: 24px;
  max-height: 120px;
  overflow-y: auto;
  background: transparent;
  ${thinScrollbar}
  &::placeholder { color: #9ca3af; }
`;

export const SkillPickerSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0 16px 16px;
`;

export const SkillPickerLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const SkillChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

export const SkillChip = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid ${(p) => (p.$selected ? '#5b1647' : '#d1d5db')};
  background: ${(p) => (p.$selected ? '#5b1647' : '#fff')};
  color: ${(p) => (p.$selected ? '#fff' : '#374151')};

  &:hover {
    border-color: ${(p) => (p.$selected ? '#4a1239' : '#9ca3af')};
    background: ${(p) => (p.$selected ? '#4a1239' : '#f9fafb')};
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

export const SendBtn = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$active ? '#5b1647' : '#e5e7eb')};
  color: ${(p) => (p.$active ? '#fff' : '#9ca3af')};
  cursor: ${(p) => (p.$active ? 'pointer' : 'default')};
  flex-shrink: 0;
  &:hover { background: ${(p) => (p.$active ? '#4a1239' : '#e5e7eb')}; }
  svg { width: 14px; height: 14px; }
`;

export const AttachBtn = styled.button<{ $uploading?: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: none;
  color: ${(p) => (p.$uploading ? '#5b1647' : '#6b7280')};
  cursor: ${(p) => (p.$uploading ? 'default' : 'pointer')};
  flex-shrink: 0;
  opacity: ${(p) => (p.$uploading ? 0.6 : 1)};
  &:hover { background: #f3f4f6; color: #374151; }
  svg { width: 16px; height: 16px; }

  ${(p) =>
    p.$uploading &&
    `
    @keyframes spin { to { transform: rotate(360deg); } }
    svg { animation: spin 1s linear infinite; }
  `}
`;

export const FileChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

export const FileChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #374151;
  max-width: 200px;
`;

export const FileChipName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FileChipRemove = styled.button`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  &:hover { color: #dc2626; background: #fee2e2; }
  svg { width: 12px; height: 12px; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const SkillChipSkeleton = styled.div`
  display: inline-block;
  width: 90px;
  height: 34px;
  border-radius: 20px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`;
