import { useState, useRef, useEffect, useCallback } from 'react';
import { useUpdatePlan, useUpdatePlanConfig } from '../../actions/plans';
import type { PlanConfig } from '../../types';
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
  InlineNumberInput,
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
const BOOL_OPTIONS = ['Yes', 'No'];
const DRAW_FREQ_OPTIONS = ['MONTHLY', 'None'];
const PAYOUT_TYPE_OPTIONS = ['BONUS', 'COMMISSION', 'None'];

function formatBool(val: boolean): string {
  return val ? 'Yes' : 'No';
}

function formatValue(val: string | number | null | undefined): string {
  if (val == null) return '—';
  return String(val);
}

function boolToStr(val: boolean): string {
  return val ? 'Yes' : 'No';
}

function strToBool(val: string): boolean {
  return val === 'Yes';
}

function nullableToStr(val: string | null | undefined): string {
  return val ?? 'None';
}

function strToNullable(val: string): string | null {
  return val === 'None' ? null : val;
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const configMutation = useUpdatePlanConfig(planId);

  // ---- Plan details ----
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [planType, setPlanType] = useState(plan.plan_type);
  const [frequency, setFrequency] = useState(plan.frequency);

  const hasDetailChanges =
    name !== plan.name || planType !== plan.plan_type || frequency !== plan.frequency;

  const handleDetailSave = () => {
    if (!hasDetailChanges || updateMutation.isPending) return;
    const patch: Record<string, string> = {};
    if (name !== plan.name) patch.name = name;
    if (planType !== plan.plan_type) patch.plan_type = planType;
    if (frequency !== plan.frequency) patch.frequency = frequency;
    updateMutation.mutate(patch, { onSuccess: () => setIsEditing(false) });
  };

  const handleDetailDiscard = () => {
    setName(plan.name); setPlanType(plan.plan_type); setFrequency(plan.frequency);
    setIsEditing(false); updateMutation.reset();
  };

  const handleDetailEdit = () => {
    setName(plan.name); setPlanType(plan.plan_type); setFrequency(plan.frequency);
    setIsEditing(true);
  };

  // ---- Payout ----
  const [editingPayout, setEditingPayout] = useState(false);
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(boolToStr(payout.is_automatic_payout_enabled));
  const [paymentOffset, setPaymentOffset] = useState(payout.final_payment_offset?.toString() ?? '');
  const [drawsEnabled, setDrawsEnabled] = useState(boolToStr(payout.is_draws_enabled));
  const [drawFrequency, setDrawFrequency] = useState(nullableToStr(payout.draw_frequency));

  const hasPayoutChanges =
    strToBool(autoPayoutEnabled) !== payout.is_automatic_payout_enabled ||
    (paymentOffset === '' ? null : Number(paymentOffset)) !== payout.final_payment_offset ||
    strToBool(drawsEnabled) !== payout.is_draws_enabled ||
    strToNullable(drawFrequency) !== payout.draw_frequency;

  const resetPayoutState = () => {
    setAutoPayoutEnabled(boolToStr(payout.is_automatic_payout_enabled));
    setPaymentOffset(payout.final_payment_offset?.toString() ?? '');
    setDrawsEnabled(boolToStr(payout.is_draws_enabled));
    setDrawFrequency(nullableToStr(payout.draw_frequency));
  };

  const handlePayoutSave = () => {
    if (!hasPayoutChanges || configMutation.isPending) return;
    const patch: Partial<PlanConfig> = {
      payout: {
        is_automatic_payout_enabled: strToBool(autoPayoutEnabled),
        final_payment_offset: paymentOffset === '' ? null : Number(paymentOffset),
        is_draws_enabled: strToBool(drawsEnabled),
        draw_frequency: strToNullable(drawFrequency),
      },
    };
    configMutation.mutate(patch, { onSuccess: () => setEditingPayout(false) });
  };

  // ---- Payroll ----
  const [editingPayroll, setEditingPayroll] = useState(false);
  const [payoutType, setPayoutType] = useState(nullableToStr(payroll.payout_type));

  const hasPayrollChanges = strToNullable(payoutType) !== payroll.payout_type;

  const resetPayrollState = () => {
    setPayoutType(nullableToStr(payroll.payout_type));
  };

  const handlePayrollSave = () => {
    if (!hasPayrollChanges || configMutation.isPending) return;
    const patch: Partial<PlanConfig> = {
      payroll: { payout_type: strToNullable(payoutType) },
    };
    configMutation.mutate(patch, { onSuccess: () => setEditingPayroll(false) });
  };

  // ---- Disputes ----
  const [editingDisputes, setEditingDisputes] = useState(false);
  const [disputesEnabled, setDisputesEnabled] = useState(boolToStr(disputes.is_disputes_enabled));

  const hasDisputesChanges = strToBool(disputesEnabled) !== disputes.is_disputes_enabled;

  const resetDisputesState = () => {
    setDisputesEnabled(boolToStr(disputes.is_disputes_enabled));
  };

  const handleDisputesSave = () => {
    if (!hasDisputesChanges || configMutation.isPending) return;
    const patch: Partial<PlanConfig> = {
      disputes: { is_disputes_enabled: strToBool(disputesEnabled) },
    };
    configMutation.mutate(patch, { onSuccess: () => setEditingDisputes(false) });
  };

  return (
    <Container>
      {/* ---- Plan Details ---- */}
      <SectionTitle>
        Plan details
        {!isEditing && (
          <EditIconBtn onClick={handleDetailEdit} title="Edit plan details"><EditIcon /></EditIconBtn>
        )}
      </SectionTitle>
      <Table>
        <Row>
          <LabelCell>Plan name</LabelCell>
          {isEditing ? (
            <EditableValueCell><InlineInput value={name} onChange={(e) => setName(e.target.value)} /></EditableValueCell>
          ) : (
            <ValueCell>{plan.name}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Type</LabelCell>
          {isEditing ? (
            <EditableValueCell><Dropdown value={planType} options={TYPE_OPTIONS} onChange={setPlanType} /></EditableValueCell>
          ) : (
            <ValueCell>{plan.plan_type}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Frequency</LabelCell>
          {isEditing ? (
            <EditableValueCell><Dropdown value={frequency} options={FREQUENCY_OPTIONS} onChange={setFrequency} /></EditableValueCell>
          ) : (
            <ValueCell>{plan.frequency}</ValueCell>
          )}
        </Row>
        <Row><LabelCell>Mode</LabelCell><ValueCell>{plan.mode}</ValueCell></Row>
        <Row><LabelCell>Artifacts</LabelCell><ValueCell>{plan.artifacts.length} artifact{plan.artifacts.length !== 1 ? 's' : ''}</ValueCell></Row>
      </Table>
      {isEditing && (
        <SaveBar>
          <SaveBtn $variant="secondary" onClick={handleDetailDiscard}>Cancel</SaveBtn>
          <SaveBtn onClick={handleDetailSave} disabled={!hasDetailChanges || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </SaveBtn>
        </SaveBar>
      )}

      <SectionGap />

      {/* ---- Payout ---- */}
      <SectionTitle>
        Payout
        {!editingPayout && (
          <EditIconBtn onClick={() => { resetPayoutState(); setEditingPayout(true); }} title="Edit payout"><EditIcon /></EditIconBtn>
        )}
      </SectionTitle>
      <Table>
        <Row>
          <LabelCell>Automatic payout</LabelCell>
          {editingPayout ? (
            <EditableValueCell><Dropdown value={autoPayoutEnabled} options={BOOL_OPTIONS} onChange={setAutoPayoutEnabled} /></EditableValueCell>
          ) : (
            <ValueCell>{formatBool(payout.is_automatic_payout_enabled)}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Final payment offset</LabelCell>
          {editingPayout ? (
            <EditableValueCell>
              <InlineNumberInput value={paymentOffset} onChange={(e) => setPaymentOffset(e.target.value)} placeholder="Days" min={0} />
            </EditableValueCell>
          ) : (
            <ValueCell>{formatValue(payout.final_payment_offset)}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Draws enabled</LabelCell>
          {editingPayout ? (
            <EditableValueCell><Dropdown value={drawsEnabled} options={BOOL_OPTIONS} onChange={setDrawsEnabled} /></EditableValueCell>
          ) : (
            <ValueCell>{formatBool(payout.is_draws_enabled)}</ValueCell>
          )}
        </Row>
        <Row>
          <LabelCell>Draw frequency</LabelCell>
          {editingPayout ? (
            <EditableValueCell><Dropdown value={drawFrequency} options={DRAW_FREQ_OPTIONS} onChange={setDrawFrequency} /></EditableValueCell>
          ) : (
            <ValueCell>{formatValue(payout.draw_frequency)}</ValueCell>
          )}
        </Row>
      </Table>
      {editingPayout && (
        <SaveBar>
          <SaveBtn $variant="secondary" onClick={() => { resetPayoutState(); setEditingPayout(false); configMutation.reset(); }}>Cancel</SaveBtn>
          <SaveBtn onClick={handlePayoutSave} disabled={!hasPayoutChanges || configMutation.isPending}>
            {configMutation.isPending ? 'Saving...' : 'Save changes'}
          </SaveBtn>
        </SaveBar>
      )}

      <SectionGap />

      {/* ---- Payroll ---- */}
      <SectionTitle>
        Payroll
        {!editingPayroll && (
          <EditIconBtn onClick={() => { resetPayrollState(); setEditingPayroll(true); }} title="Edit payroll"><EditIcon /></EditIconBtn>
        )}
      </SectionTitle>
      <Table>
        <Row>
          <LabelCell>Payout type</LabelCell>
          {editingPayroll ? (
            <EditableValueCell><Dropdown value={payoutType} options={PAYOUT_TYPE_OPTIONS} onChange={setPayoutType} /></EditableValueCell>
          ) : (
            <ValueCell>{formatValue(payroll.payout_type)}</ValueCell>
          )}
        </Row>
      </Table>
      {editingPayroll && (
        <SaveBar>
          <SaveBtn $variant="secondary" onClick={() => { resetPayrollState(); setEditingPayroll(false); configMutation.reset(); }}>Cancel</SaveBtn>
          <SaveBtn onClick={handlePayrollSave} disabled={!hasPayrollChanges || configMutation.isPending}>
            {configMutation.isPending ? 'Saving...' : 'Save changes'}
          </SaveBtn>
        </SaveBar>
      )}

      <SectionGap />

      {/* ---- Disputes ---- */}
      <SectionTitle>
        Disputes
        {!editingDisputes && (
          <EditIconBtn onClick={() => { resetDisputesState(); setEditingDisputes(true); }} title="Edit disputes"><EditIcon /></EditIconBtn>
        )}
      </SectionTitle>
      <Table>
        <Row>
          <LabelCell>Disputes enabled</LabelCell>
          {editingDisputes ? (
            <EditableValueCell><Dropdown value={disputesEnabled} options={BOOL_OPTIONS} onChange={setDisputesEnabled} /></EditableValueCell>
          ) : (
            <ValueCell>{formatBool(disputes.is_disputes_enabled)}</ValueCell>
          )}
        </Row>
      </Table>
      {editingDisputes && (
        <SaveBar>
          <SaveBtn $variant="secondary" onClick={() => { resetDisputesState(); setEditingDisputes(false); configMutation.reset(); }}>Cancel</SaveBtn>
          <SaveBtn onClick={handleDisputesSave} disabled={!hasDisputesChanges || configMutation.isPending}>
            {configMutation.isPending ? 'Saving...' : 'Save changes'}
          </SaveBtn>
        </SaveBar>
      )}
    </Container>
  );
}
