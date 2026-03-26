import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCreatePlan } from '../actions/plans';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 440px;
  max-width: 90vw;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: -12px 0 0;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 3px rgba(91, 22, 71, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  background: #fff;
  font-family: inherit;
  cursor: pointer;

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 3px rgba(91, 22, 71, 0.1);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: #f9fafb;
  }
`;

const CreateButton = styled.button<{ $disabled: boolean }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$disabled ? '#d1d5db' : '#5b1647')};
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  font-family: inherit;

  &:hover {
    background: ${(p) => (p.$disabled ? '#d1d5db' : '#4a1239')};
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #dc2626;
  margin: -12px 0 0;
`;

interface NewPlanModalProps {
  onClose: () => void;
}

export function NewPlanModal({ onClose }: NewPlanModalProps) {
  const [name, setName] = useState('');
  const [planType, setPlanType] = useState('RECURRING');
  const [frequency, setFrequency] = useState('QUARTERLY');
  const navigate = useNavigate();
  const createPlan = useCreatePlan();

  const canSubmit = name.trim().length > 0 && !createPlan.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    createPlan.mutate(
      { name: name.trim(), plan_type: planType, frequency },
      {
        onSuccess: (plan) => {
          onClose();
          navigate(`/variable-compensation/plans/${plan.plan_id}`);
        },
      },
    );
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <Title>Create a new plan</Title>
        <Subtitle>Set up the basics — you can refine everything with AI once the plan is created.</Subtitle>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field>
            <Label htmlFor="plan-name">Plan name</Label>
            <Input
              id="plan-name"
              type="text"
              placeholder="e.g. Q1 Sales Commission"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>

          <Field>
            <Label htmlFor="plan-type">Plan type</Label>
            <Select id="plan-type" value={planType} onChange={(e) => setPlanType(e.target.value)}>
              <option value="RECURRING">Recurring</option>
              <option value="ONE_TIME">One-time</option>
            </Select>
          </Field>

          <Field>
            <Label htmlFor="frequency">Frequency</Label>
            <Select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUALLY">Annually</option>
            </Select>
          </Field>

          {createPlan.isError && (
            <ErrorText>Failed to create plan. Please try again.</ErrorText>
          )}

          <ButtonRow>
            <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
            <CreateButton type="submit" $disabled={!canSubmit}>
              {createPlan.isPending ? 'Creating...' : 'Create plan'}
            </CreateButton>
          </ButtonRow>
        </form>
      </Modal>
    </Overlay>
  );
}
