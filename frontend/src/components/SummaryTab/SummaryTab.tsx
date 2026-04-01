import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useUpdatePlan, useUpdatePlanConfig } from '../../actions/plans';
import type { Plan, PlanConfig } from '../../types';
import type { SummaryTabProps } from './SummaryTab.types';
import { MembershipRulesSection } from '../MembershipRules/MembershipRulesSection';
import { sortArtifacts } from '../../utils/artifactLabels';
import { PlanTakeover } from '../PlanTakeover/PlanTakeover';
import {
  Container,
  SectionTitle,
  ViewToggle,
  ViewToggleBtn,
  ExpandButton,
  ConfigEditor,
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
  SectionGap,
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

function composeSql(plan: Plan): string {
  const arts = plan.artifacts.filter((a) => a.name && a.sql_expression);
  if (arts.length === 0) return '-- No SQL artifacts defined yet.';
  return arts
    .map((a) => `-- ${a.name}\n${a.sql_expression}`)
    .join('\n\n');
}

import { highlightSQL } from '../../utils/highlightSQL';

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
              {opt}
              {opt === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
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

  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'config'>('table');
  const [expanded, setExpanded] = useState(false);

  const [name, setName] = useState(plan.name);
  const [planType, setPlanType] = useState(plan.plan_type);
  const [frequency, setFrequency] = useState(plan.frequency);
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(boolToStr(payout.is_automatic_payout_enabled));
  const [paymentOffset, setPaymentOffset] = useState(payout.final_payment_offset?.toString() ?? '');
  const [drawsEnabled, setDrawsEnabled] = useState(boolToStr(payout.is_draws_enabled));
  const [drawFrequency, setDrawFrequency] = useState(nullableToStr(payout.draw_frequency));
  const [payoutType, setPayoutType] = useState(nullableToStr(payroll.payout_type));
  const [disputesEnabled, setDisputesEnabled] = useState(boolToStr(disputes.is_disputes_enabled));

  const hasDetailChanges =
    name !== plan.name || planType !== plan.plan_type || frequency !== plan.frequency;
  const hasPayoutChanges =
    strToBool(autoPayoutEnabled) !== payout.is_automatic_payout_enabled ||
    (paymentOffset === '' ? null : Number(paymentOffset)) !== payout.final_payment_offset ||
    strToBool(drawsEnabled) !== payout.is_draws_enabled ||
    strToNullable(drawFrequency) !== payout.draw_frequency;
  const hasPayrollChanges = strToNullable(payoutType) !== payroll.payout_type;
  const hasDisputesChanges = strToBool(disputesEnabled) !== disputes.is_disputes_enabled;
  const hasChanges = hasDetailChanges || hasPayoutChanges || hasPayrollChanges || hasDisputesChanges;
  const isSaving = updateMutation.isPending || configMutation.isPending;

  const resetAll = () => {
    setName(plan.name); setPlanType(plan.plan_type); setFrequency(plan.frequency);
    setAutoPayoutEnabled(boolToStr(payout.is_automatic_payout_enabled));
    setPaymentOffset(payout.final_payment_offset?.toString() ?? '');
    setDrawsEnabled(boolToStr(payout.is_draws_enabled));
    setDrawFrequency(nullableToStr(payout.draw_frequency));
    setPayoutType(nullableToStr(payroll.payout_type));
    setDisputesEnabled(boolToStr(disputes.is_disputes_enabled));
  };

  const handleEdit = () => { resetAll(); setIsEditing(true); };

  const handleDiscard = () => {
    resetAll(); setIsEditing(false);
    updateMutation.reset(); configMutation.reset();
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;
    if (hasDetailChanges) {
      const patch: Record<string, string> = {};
      if (name !== plan.name) patch.name = name;
      if (planType !== plan.plan_type) patch.plan_type = planType;
      if (frequency !== plan.frequency) patch.frequency = frequency;
      await updateMutation.mutateAsync(patch);
    }
    if (hasPayoutChanges || hasPayrollChanges || hasDisputesChanges) {
      const patch: Partial<PlanConfig> = {};
      if (hasPayoutChanges) {
        patch.payout = {
          is_automatic_payout_enabled: strToBool(autoPayoutEnabled),
          final_payment_offset: paymentOffset === '' ? null : Number(paymentOffset),
          is_draws_enabled: strToBool(drawsEnabled),
          draw_frequency: strToNullable(drawFrequency),
        };
      }
      if (hasPayrollChanges) patch.payroll = { payout_type: strToNullable(payoutType) };
      if (hasDisputesChanges) patch.disputes = { is_disputes_enabled: strToBool(disputesEnabled) };
      await configMutation.mutateAsync(patch);
    }
    setIsEditing(false);
  };

  return (
    <Container>
      <SectionTitle>
        Plan details
        <ViewToggle>
          <ViewToggleBtn $active={viewMode === 'table'} onClick={() => setViewMode('table')} title="Table view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </ViewToggleBtn>
          <ViewToggleBtn $active={viewMode === 'config'} onClick={() => setViewMode('config')} title="SQL view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="8 6 2 12 8 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ViewToggleBtn>
        </ViewToggle>
        <ExpandButton onClick={() => setExpanded(true)} title="Expand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="9 21 3 21 3 15" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21" y1="3" x2="14" y2="10" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="21" x2="10" y2="14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ExpandButton>
      </SectionTitle>

      {viewMode === 'config' ? (
        <ConfigEditor>
          {highlightSQL(composeSql(plan))}
        </ConfigEditor>
      ) : (
        <>
          <Table $noBorder>
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
            <Row>
              <LabelCell>Automatic payout</LabelCell>
              {isEditing ? (
                <EditableValueCell><Dropdown value={autoPayoutEnabled} options={BOOL_OPTIONS} onChange={setAutoPayoutEnabled} /></EditableValueCell>
              ) : (
                <ValueCell>{formatBool(payout.is_automatic_payout_enabled)}</ValueCell>
              )}
            </Row>
            <Row>
              <LabelCell>Final payment offset</LabelCell>
              {isEditing ? (
                <EditableValueCell>
                  <InlineNumberInput value={paymentOffset} onChange={(e) => setPaymentOffset(e.target.value)} placeholder="Days" min={0} />
                </EditableValueCell>
              ) : (
                <ValueCell>{formatValue(payout.final_payment_offset)}</ValueCell>
              )}
            </Row>
            <Row>
              <LabelCell>Draws enabled</LabelCell>
              {isEditing ? (
                <EditableValueCell><Dropdown value={drawsEnabled} options={BOOL_OPTIONS} onChange={setDrawsEnabled} /></EditableValueCell>
              ) : (
                <ValueCell>{formatBool(payout.is_draws_enabled)}</ValueCell>
              )}
            </Row>
            <Row>
              <LabelCell>Draw frequency</LabelCell>
              {isEditing ? (
                <EditableValueCell><Dropdown value={drawFrequency} options={DRAW_FREQ_OPTIONS} onChange={setDrawFrequency} /></EditableValueCell>
              ) : (
                <ValueCell>{formatValue(payout.draw_frequency)}</ValueCell>
              )}
            </Row>
            <Row>
              <LabelCell>Payout type</LabelCell>
              {isEditing ? (
                <EditableValueCell><Dropdown value={payoutType} options={PAYOUT_TYPE_OPTIONS} onChange={setPayoutType} /></EditableValueCell>
              ) : (
                <ValueCell>{formatValue(payroll.payout_type)}</ValueCell>
              )}
            </Row>
            <Row>
              <LabelCell>Disputes enabled</LabelCell>
              {isEditing ? (
                <EditableValueCell><Dropdown value={disputesEnabled} options={BOOL_OPTIONS} onChange={setDisputesEnabled} /></EditableValueCell>
              ) : (
                <ValueCell>{formatBool(disputes.is_disputes_enabled)}</ValueCell>
              )}
            </Row>
          </Table>
          {isEditing && (
            <SaveBar>
              <SaveBtn $variant="secondary" onClick={handleDiscard}>Cancel</SaveBtn>
              <SaveBtn onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </SaveBtn>
            </SaveBar>
          )}
        </>
      )}

      {expanded && <PlanTakeover plan={plan} onClose={() => setExpanded(false)} />}

      <SectionGap />

      <SectionTitle>Membership rules</SectionTitle>
      <MembershipRulesSection planId={planId} membership={plan.membership} />
    </Container>
  );
}
