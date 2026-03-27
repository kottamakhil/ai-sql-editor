import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  min-height: 500px;
  position: relative;
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: #9ca3af;
  font-size: 14px;
`;

export const SourceNode = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  min-width: 140px;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #6b7280;
  }
`;

export const ArtifactNode = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5eef8;
  border: 1.5px solid #5b1647;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #5b1647;
  min-width: 140px;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;
