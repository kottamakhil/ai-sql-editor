import styled from 'styled-components';

export const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  width: 100%;
  max-width: 600px;
`;

export const CardHeader = styled.div`
  padding: 16px 20px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const QuestionText = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  line-height: 1.4;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const Counter = styled.span`
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
`;

export const CloseBtn = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  &:hover { background: #f3f4f6; color: #6b7280; }
  svg { width: 14px; height: 14px; }
`;

export const OptionsList = styled.div`
  padding: 0 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const OptionRow = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #1a1a2e;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  line-height: 1.4;
  transition: background 0.15s ease;
  &:hover { background: #2d2d4a; }
`;

export const OptionNumber = styled.span`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
`;

export const OptionLabel = styled.span`
  flex: 1;
`;

export const CardFooter = styled.div`
  padding: 8px 20px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const FreetextRow = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #9ca3af;
  svg { width: 14px; height: 14px; flex-shrink: 0; }
`;

export const FreetextInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #1a1a2e;
  font-family: inherit;
  background: transparent;
  &::placeholder { color: #9ca3af; }
`;

export const SkipBtn = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #f3f4f6; color: #374151; }
`;

export const SendFreetextBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: #5b1647;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: #4a1239; }
  svg { width: 12px; height: 12px; }
`;
