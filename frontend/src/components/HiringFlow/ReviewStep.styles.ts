import styled from 'styled-components';

export const StepContainer = styled.div`
  width: 100%;
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
`;

export const SectionSubtitle = styled.p`
  font-size: 13px;
  color: #9ca3af;
  margin: 0 0 24px;
`;

export const ReviewCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
`;

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HeaderName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
`;

export const HeaderRole = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  font-size: 13px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

export const DetailLabel = styled.span`
  color: #6b7280;
`;

export const DetailValue = styled.span`
  color: #1a1a2e;
  font-weight: 500;
  text-align: right;
`;

export const ObligationCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
`;

export const ObligationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
`;

export const ObligationTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
`;

export const Badge = styled.span<{ $color?: string }>`
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
  background: ${(p) => (p.$color === 'green' ? '#f0fdf4' : '#f3f4f6')};
  color: ${(p) => (p.$color === 'green' ? '#16a34a' : '#6b7280')};
  border: 1px solid ${(p) => (p.$color === 'green' ? '#bbf7d0' : '#e5e7eb')};
`;

export const BadgeRow = styled.div`
  display: flex;
  gap: 6px;
`;

export const InfoBox = styled.div`
  margin-top: 8px;
  padding: 16px 20px;
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
`;

export const InfoTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const InfoText = styled.p`
  font-size: 13px;
  color: #374151;
  margin: 0;
  line-height: 1.5;
`;

export const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
`;

export const PrimaryButton = styled.button`
  padding: 10px 28px;
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
  padding: 10px 28px;
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
