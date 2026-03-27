import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px;
`;

export const Table = styled.div`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
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
