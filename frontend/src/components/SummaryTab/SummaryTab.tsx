import { useState, useRef, useEffect, useCallback } from 'react';
import { useUpdatePlan } from '../../actions/plans';
import type { SummaryTabProps } from './SummaryTab.types';
import {
  Container,
  SectionTitle,
  SectionGap,
  Table,
  Row,
  LabelCell,
  ValueCell,
  EditableValueCell,
  InlineInput,
  DropdownWrapper,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  SaveBar,
  SaveBtn,
  EditIconBtn,
} from './SummaryTab.styles';

const FREQUENCY_OPTIONS = ['MONTHLY', 'QUARTERLY', 'ANNUALLY'];
const TYPE_OPTIONS = ['RECURRING', 'ONE_TIME', 'SPIF'];

function formatBool(val: boolean): string {
  return val ? 'Yes' : 'No';
}

function formatValue(val: string | number | null | undefined): string {
  if (val == null) return '—';
  return String(val);
}

function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <DropdownWrapper ref={wrapperRef}>
      <DropdownTrigger $open={open} onClick={() => setOpen((o) => !o)} type="button">
        {value}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </DropdownTrigger>
      {open && (
        <DropdownMenu>
          {options.map((opt) => (
            <DropdownItem
              key={opt}
              $active={opt === value}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {opt}
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </DropdownWrapper>
  );
}

export function SummaryTab({ plan, planId }: SummaryTabProps) {
  const { payout, payroll, disputes } = plan.config;
  const updateMutation = useUpdatePlan(planId);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [planType, setPlanType] = useState(plan.plan_type);
  const [frequency, setFrequency] = useState(plan.frequency);

  const hasChanges =
    name !== plan.name || planType !== plan.plan_type || frequency !== plan.frequency;

  const handleSave = () => {
    if (!hasChanges || updateMutation.isPending) return;
    const patch: Record<string, string> = {};
    if (name !== plan.name) patch.name = name;
    if (planType !== plan.plan_type) patch.plan_type = planType;
    if (frequency !== plan.frequency) patch.frequency = frequency;
    updateMutation.mutate(patch, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleDiscard = () => {
    setName(plan.name);
    setPlanType(plan.plan_type);
    setFrequency(plan.frequency);
    setIsEditing(false);
    updateMutation.reset();
  };

  const handleEdit = () => {
    setName(plan.name);
    setPlanType(plan.plan_type);
    setFrequency(plan.frequency);
    setIsEditing(true);
  };

  return (
    <Container>
      <SectionTitle>
        Plan details
        {!isEditing && (
          <EditIconBtn onClick={handleEdit} title="Edit plan details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </EditIconBtn>
        )}
      </SectionTitle>
      <Table>
        <Row>
          <LabelCell>Plan name</LabelCell>
          {isEditing ? (
            <EditableValueCell>
              <InlineInput value={name} onChange={(e) => setName(e.target.value)} />
            </EditableValueCell>
          ) : (
            <ValueCell>{plan.name}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Type</LabelCell>
          {isEditing ? (
            <EditableValueCell>
              <Dropdown value={planType} options={TYPE_OPTIONS} onChange={setPlanType} />
            </EditableValueCell>
          ) : (
            <ValueCell>{plan.plan_type}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Frequency</LabelCell>
          {isEditing ? (
            <EditableValueCell>
              <Dropdown value={frequency} options={FREQUENCY_OPTIONS} onChange={setFrequency} />
            </EditableValueCell>
          ) : (
            <ValueCell>{plan.frequency}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Mode</LabelCell>
          <ValueCell>{plan.mode}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Artifacts</LabelCell>
          <ValueCell>{plan.artifacts.length} artifact{plan.artifacts.length !== 1 ? 's' : ''}</ValueCell>
        </Row>
      </Table>

      {isEditing && (
        <SaveBar>
          <SaveBtn $variant="secondary" onClick={handleDiscard}>
            Cancel
          </SaveBtn>
          <SaveBtn onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </SaveBtn>
        </SaveBar>
      )}

      <SectionGap />

      <SectionTitle>Payout</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Automatic payout</LabelCell>
          <ValueCell>{formatBool(payout.is_automatic_payout_enabled)}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Final payment offset</LabelCell>
          <ValueCell>{formatValue(payout.final_payment_offset)}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Draws enabled</LabelCell>
          <ValueCell>{formatBool(payout.is_draws_enabled)}</ValueCell>
        </Row>
        <Row>
          <LabelCell>Draw frequency</LabelCell>
          <ValueCell>{formatValue(payout.draw_frequency)}</ValueCell>
        </Row>
      </Table>

      <SectionGap />

      <SectionTitle>Payroll</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Payout type</LabelCell>
          <ValueCell>{formatValue(payroll.payout_type)}</ValueCell>
        </Row>
      </Table>

      <SectionGap />

      <SectionTitle>Disputes</SectionTitle>
      <Table>
        <Row>
          <LabelCell>Disputes enabled</LabelCell>
          <ValueCell>{formatBool(disputes.is_disputes_enabled)}</ValueCell>
        </Row>
      </Table>
    </Container>
  );
}
