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

export const EmployeeCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 8px;
`;

export const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const EmployeeInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const EmployeeName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
`;

export const EmployeeRole = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
`;

export const DetailLabel = styled.span`
  color: #6b7280;
`;

export const DetailValue = styled.span`
  color: #1a1a2e;
  font-weight: 500;
  text-align: right;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
`;

export const FormField = styled.div<{ $span?: number }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: ${(p) => (p.$span ? `span ${p.$span}` : 'auto')};
`;

export const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
`;

export const TextInput = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a2e;
  outline: none;

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const SubHeading = styled.h3`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin: 24px 0 12px;
`;

export const QuestionBlock = styled.div`
  margin-top: 28px;
`;

export const QuestionText = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0 0 12px;
`;

export const RadioOption = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  background: ${(p) => (p.$selected ? '#5B1647' : 'transparent')};
  color: ${(p) => (p.$selected ? '#fff' : '#374151')};
  border: 1px solid ${(p) => (p.$selected ? '#5B1647' : '#e5e7eb')};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(p) => (p.$selected ? '#5B1647' : '#9ca3af')};
  }

  input {
    accent-color: #5B1647;
  }
`;

export const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
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

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
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
