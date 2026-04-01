import styled, { keyframes } from 'styled-components';

const scaleIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
`;

export const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  max-width: 500px;
  margin: 0 auto;
`;

export const CheckCircle = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: ${scaleIn} 0.5s ease-out;

  svg {
    width: 36px;
    height: 36px;
    color: #16a34a;
  }
`;

export const Heading = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
`;

export const SubText = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 32px;
  line-height: 1.5;
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 12px;
`;

export const PrimaryButton = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: #5B1647;
  color: #fff;

  &:hover {
    background: #4a1239;
  }
`;

export const SecondaryButton = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #374151;

  &:hover {
    background: #f3f4f6;
  }
`;
