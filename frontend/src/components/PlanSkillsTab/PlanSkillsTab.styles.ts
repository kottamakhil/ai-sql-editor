import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const NoticeBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f0f4ff;
  border: 1px solid #c7d6fe;
  border-radius: 8px;
  font-size: 13px;
  color: #3b5998;
  line-height: 1.5;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

export const SkillCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

export const SkillName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
`;

export const VersionBadge = styled.span`
  padding: 2px 8px;
  border-radius: 10px;
  background: #e8e0f0;
  color: #5b1647;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

export const CardContent = styled.pre`
  margin: 0;
  padding: 16px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  background: #fff;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
  font-size: 14px;
`;
