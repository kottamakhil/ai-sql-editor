import { useState, useRef, useEffect } from 'react';
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

/* ---- Custom Dropdown ---- */

const DropdownWrapper = styled.div`
  position: relative;
`;

const DropdownTrigger = styled.button<{ $open: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$open ? '#5b1647' : '#d1d5db')};
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a2e;
  background: #fff;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  outline: none;
  box-shadow: ${(p) => (p.$open ? '0 0 0 3px rgba(91, 22, 71, 0.1)' : 'none')};

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 3px rgba(91, 22, 71, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
    transition: transform 0.15s ease;
    transform: ${(p) => (p.$open ? 'rotate(180deg)' : 'rotate(0)')};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10;
  padding: 4px;
  overflow: hidden;
`;

const DropdownOption = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$selected ? '#f3f0f5' : 'transparent')};
  color: ${(p) => (p.$selected ? '#5b1647' : '#1a1a2e')};
  font-size: 14px;
  font-weight: ${(p) => (p.$selected ? '500' : '400')};
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${(p) => (p.$selected ? '#ebe5ee' : '#f9fafb')};
  }
`;

const CheckIcon = styled.span<{ $visible: boolean }>`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: ${(p) => (p.$visible ? 'visible' : 'hidden')};
  color: #5b1647;

  svg {
    width: 14px;
    height: 14px;
  }
`;

interface DropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Dropdown({ value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <DropdownWrapper ref={ref}>
      <DropdownTrigger type="button" $open={open} onClick={() => setOpen(!open)}>
        {selectedLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </DropdownTrigger>
      {open && (
        <DropdownMenu>
          {options.map((opt) => (
            <DropdownOption
              key={opt.value}
              type="button"
              $selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <CheckIcon $visible={opt.value === value}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CheckIcon>
              {opt.label}
            </DropdownOption>
          ))}
        </DropdownMenu>
      )}
    </DropdownWrapper>
  );
}

/* ---- Modal buttons ---- */

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

/* ---- Options ---- */

const PLAN_TYPE_OPTIONS = [
  { value: 'RECURRING', label: 'Recurring' },
  { value: 'ONE_TIME', label: 'One-time' },
];

const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
];

/* ---- Component ---- */

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
            <Label>Plan name</Label>
            <Input
              type="text"
              placeholder="e.g. Q1 Sales Commission"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>

          <Field>
            <Label>Plan type</Label>
            <Dropdown value={planType} options={PLAN_TYPE_OPTIONS} onChange={setPlanType} />
          </Field>

          <Field>
            <Label>Frequency</Label>
            <Dropdown value={frequency} options={FREQUENCY_OPTIONS} onChange={setFrequency} />
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
