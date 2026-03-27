import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 24px;
`;

export const Card = styled.div`
  max-width: 520px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  color: #6b21a8;
  font-size: 13px;
  font-weight: 500;
`;

export const Heading = styled.h1`
  font-size: 26px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
`;

export const Description = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0;
`;
