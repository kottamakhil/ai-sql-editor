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
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

export const Modal = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 720px;
  max-width: 86vw;
  height: 64vh;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

export const CloseBtn = styled.button`
  width: 46px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  &:hover { background: #fff; color: #374151; border-color: #d1d5db; }
`;

export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 260px;
  padding: 52px 18px 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-top: none;
  border-right: none;
  border-left: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0;
  ${thinScrollbar}
`;

export const WelcomeHint = styled.div`
  text-align: left;
  padding: 12px 8px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.55;
  margin-bottom: 8px;
`;

export const WelcomeInput = styled.textarea`
  width: 100%;
  min-height: 110px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: #4b5563;
  font-size: 16px;
  line-height: 1.3;
  font-family: inherit;
  padding: 0;
  margin: 0;
  ${thinScrollbar}

  &::placeholder {
    color: #6b7280;
    opacity: 1;
  }
`;

export const MessageBubble = styled.div<{ $role: string }>`
  max-width: 85%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  margin-bottom: 10px;
  align-self: ${(p) => (p.$role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${(p) => (p.$role === 'user' ? '#f0f0f0' : 'transparent')};
  color: #1a1a2e;
  border: none;
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
  padding: 10px 18px 12px;
  background: #fff;
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: none;
  border-radius: 0;
  padding: 0;
  background: transparent;
`;

export const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;
  background: transparent;
  ${thinScrollbar}
  &::placeholder { color: #9ca3af; }
`;

export const SkillPickerSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  padding: 16px 4px 14px;
`;

export const SkillPickerLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: none;
  letter-spacing: 0;
`;

export const SkillChips = styled.div`
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 10px;
`;

export const SkillChip = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 36px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid ${(p) => (p.$selected ? '#111827' : '#d1d5db')};
  background: ${(p) => (p.$selected ? '#111827' : '#fff')};
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
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: ${(p) => (p.$active ? '#d1d5db' : '#e5e7eb')};
  color: #6b7280;
  cursor: ${(p) => (p.$active ? 'pointer' : 'default')};
  flex-shrink: 0;
  &:hover { background: ${(p) => (p.$active ? '#c5cbd3' : '#e5e7eb')}; }
  svg { width: 20px; height: 20px; }
`;

export const AttachBtn = styled.button<{ $uploading?: boolean }>`
  width: 56px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: ${(p) => (p.$uploading ? '#5b1647' : '#6b7280')};
  cursor: ${(p) => (p.$uploading ? 'default' : 'pointer')};
  flex-shrink: 0;
  opacity: ${(p) => (p.$uploading ? 0.6 : 1)};
  &:hover { background: #f8fafc; color: #374151; }
  svg { width: 22px; height: 22px; }

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
  width: 36px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`;
