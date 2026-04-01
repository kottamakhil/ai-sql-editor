import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useEmployeeFieldValues,
  useUpdateMembership,
  usePlanMembers,
} from '../../actions/plans';
import type { MembershipRule, PlanMembership, Employee } from '../../types';
import {
  Section,
  RulesContainer,
  MatchTypeRow,
  MatchTypeToggle,
  RuleChipsArea,
  RuleChip,
  ExceptionChip,
  ChipRemoveBtn,
  AddRuleBtn,
  PickerOverlay,
  PickerDropdown,
  PickerItem,
  PickerBack,
  PickerHeader,
  ExceptDivider,
  PreviewBar,
  PreviewBtn,
  MemberCount,
  MembersList,
  MemberRow,
  MemberName,
  MemberDetail,
  SaveBar,
  SaveBtn,
} from './MembershipRules.styles';

const FIELD_LABELS: Record<string, string> = {
  department: 'Department',
  role: 'Role',
  country: 'Country',
};

interface Props {
  planId: string;
  membership?: PlanMembership | null;
}

export function MembershipRulesSection({ planId, membership }: Props) {
  const { data: fieldValues } = useEmployeeFieldValues();
  const updateMutation = useUpdateMembership(planId);
  const { data: members, refetch: refetchMembers, isFetching: membersFetching } =
    usePlanMembers(planId, false);

  const [isEditing, setIsEditing] = useState(false);
  const [matchType, setMatchType] = useState<'all' | 'any'>(membership?.match_type ?? 'all');
  const [rules, setRules] = useState<MembershipRule[]>(membership?.rules ?? []);
  const [exceptions, setExceptions] = useState<MembershipRule[]>(membership?.exceptions ?? []);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setMatchType(membership?.match_type ?? 'all');
    setRules(membership?.rules ?? []);
    setExceptions(membership?.exceptions ?? []);
  }, [membership]);

  const hasChanges = (() => {
    const orig = membership ?? { match_type: 'all', rules: [], exceptions: [] };
    return (
      matchType !== orig.match_type ||
      JSON.stringify(rules) !== JSON.stringify(orig.rules) ||
      JSON.stringify(exceptions) !== JSON.stringify(orig.exceptions)
    );
  })();

  const handleSave = () => {
    if (!hasChanges || updateMutation.isPending) return;
    updateMutation.mutate(
      { match_type: matchType, rules, exceptions },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDiscard = () => {
    setMatchType(membership?.match_type ?? 'all');
    setRules(membership?.rules ?? []);
    setExceptions(membership?.exceptions ?? []);
    setIsEditing(false);
  };

  const addRule = (field: string, value: string) => {
    setRules((prev) => {
      const existing = prev.find((r) => r.field === field);
      if (existing) {
        if (existing.values.includes(value)) return prev;
        return prev.map((r) =>
          r.field === field ? { ...r, values: [...r.values, value] } : r,
        );
      }
      return [...prev, { field, values: [value] }];
    });
  };

  const removeRuleValue = (field: string, value: string) => {
    setRules((prev) =>
      prev
        .map((r) =>
          r.field === field ? { ...r, values: r.values.filter((v) => v !== value) } : r,
        )
        .filter((r) => r.values.length > 0),
    );
  };

  const addException = (field: string, value: string) => {
    setExceptions((prev) => {
      const existing = prev.find((r) => r.field === field);
      if (existing) {
        if (existing.values.includes(value)) return prev;
        return prev.map((r) =>
          r.field === field ? { ...r, values: [...r.values, value] } : r,
        );
      }
      return [...prev, { field, values: [value] }];
    });
  };

  const removeExceptionValue = (field: string, value: string) => {
    setExceptions((prev) =>
      prev
        .map((r) =>
          r.field === field ? { ...r, values: r.values.filter((v) => v !== value) } : r,
        )
        .filter((r) => r.values.length > 0),
    );
  };

  const handlePreview = () => {
    if (hasChanges) {
      updateMutation.mutate(
        { match_type: matchType, rules, exceptions },
        {
          onSuccess: () => {
            setIsEditing(false);
            setShowPreview(true);
            refetchMembers();
          },
        },
      );
    } else {
      setShowPreview((p) => !p);
      if (!showPreview) refetchMembers();
    }
  };

  const hasRules = rules.length > 0 || exceptions.length > 0;

  return (
    <Section>
      <RulesContainer>
        {isEditing ? (
          <>
            <MatchTypeRow>
              Employee must match
              <MatchTypeToggle $active={matchType === 'all'} onClick={() => setMatchType('all')}>
                all rules
              </MatchTypeToggle>
              <MatchTypeToggle $active={matchType === 'any'} onClick={() => setMatchType('any')}>
                any rule
              </MatchTypeToggle>
            </MatchTypeRow>

            <RuleChipsArea>
              {rules.flatMap((r) =>
                r.values.map((v) => (
                  <RuleChip key={`${r.field}-${v}`}>
                    <span className="chip-field">{FIELD_LABELS[r.field] ?? r.field}</span>
                    <span className="chip-arrow">&rarr;</span>
                    <span className="chip-value">{v}</span>
                    <ChipRemoveBtn onClick={() => removeRuleValue(r.field, v)}>
                      <XIcon />
                    </ChipRemoveBtn>
                  </RuleChip>
                )),
              )}
              <RulePicker
                fieldValues={fieldValues}
                onSelect={addRule}
                label="Add rule"
              />
            </RuleChipsArea>

            <ExceptDivider>Except</ExceptDivider>

            <RuleChipsArea>
              {exceptions.flatMap((r) =>
                r.values.map((v) => (
                  <ExceptionChip key={`exc-${r.field}-${v}`}>
                    <span className="chip-field">{FIELD_LABELS[r.field] ?? r.field}</span>
                    <span className="chip-arrow">&rarr;</span>
                    <span className="chip-value">{v}</span>
                    <ChipRemoveBtn onClick={() => removeExceptionValue(r.field, v)}>
                      <XIcon />
                    </ChipRemoveBtn>
                  </ExceptionChip>
                )),
              )}
              <RulePicker
                fieldValues={fieldValues}
                onSelect={addException}
                label="Add exception"
              />
            </RuleChipsArea>

            <SaveBar>
              <SaveBtn $variant="secondary" onClick={handleDiscard}>Cancel</SaveBtn>
              <SaveBtn onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </SaveBtn>
            </SaveBar>
          </>
        ) : (
          <>
            {hasRules ? (
              <>
                <MatchTypeRow>
                  Matching <strong>{matchType === 'all' ? 'all rules' : 'any rule'}</strong>
                </MatchTypeRow>
                <RuleChipsArea>
                  {rules.flatMap((r) =>
                    r.values.map((v) => (
                      <RuleChip key={`${r.field}-${v}`}>
                        <span className="chip-field">{FIELD_LABELS[r.field] ?? r.field}</span>
                        <span className="chip-arrow">&rarr;</span>
                        <span className="chip-value">{v}</span>
                      </RuleChip>
                    )),
                  )}
                </RuleChipsArea>
                {exceptions.length > 0 && (
                  <>
                    <ExceptDivider>Except</ExceptDivider>
                    <RuleChipsArea>
                      {exceptions.flatMap((r) =>
                        r.values.map((v) => (
                          <ExceptionChip key={`exc-${r.field}-${v}`}>
                            <span className="chip-field">{FIELD_LABELS[r.field] ?? r.field}</span>
                            <span className="chip-arrow">&rarr;</span>
                            <span className="chip-value">{v}</span>
                          </ExceptionChip>
                        )),
                      )}
                    </RuleChipsArea>
                  </>
                )}
              </>
            ) : (
              <MatchTypeRow>No membership rules configured</MatchTypeRow>
            )}
          </>
        )}

        <PreviewBar>
          <PreviewBtn
            onClick={!isEditing ? handlePreview : undefined}
            disabled={isEditing || (!hasRules && !hasChanges)}
          >
            <UsersIcon />
            {showPreview ? 'Hide preview' : 'Preview members'}
          </PreviewBtn>
          {!isEditing && (
            <PreviewBtn onClick={() => setIsEditing(true)}>
              <EditIcon />
              Edit rules
            </PreviewBtn>
          )}
          {showPreview && members && (
            <MemberCount>{members.length} member{members.length !== 1 ? 's' : ''}</MemberCount>
          )}
        </PreviewBar>

        {showPreview && !isEditing && (
          <MembersList>
            {membersFetching ? (
              <MemberRow><MemberDetail>Loading...</MemberDetail></MemberRow>
            ) : members && members.length > 0 ? (
              members.map((m: Employee) => (
                <MemberRow key={m.employee_id}>
                  <MemberName>{m.name}</MemberName>
                  <MemberDetail>{m.role}</MemberDetail>
                  <MemberDetail>{m.department}</MemberDetail>
                  <MemberDetail>{m.country}</MemberDetail>
                </MemberRow>
              ))
            ) : (
              <MemberRow><MemberDetail>No matching members</MemberDetail></MemberRow>
            )}
          </MembersList>
        )}
      </RulesContainer>
    </Section>
  );
}

function RulePicker({
  fieldValues,
  onSelect,
  label,
}: {
  fieldValues?: Record<string, string[]>;
  onSelect: (field: string, value: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const openPicker = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(true);
    setSelectedField(null);
  }, []);

  const handleSelect = (field: string, value: string) => {
    onSelect(field, value);
  };

  const fields = fieldValues ? Object.keys(fieldValues) : [];

  return (
    <>
      <AddRuleBtn ref={btnRef} onClick={openPicker} type="button">
        <PlusIcon /> {label}
      </AddRuleBtn>

      {open && (
        <>
          <PickerOverlay onClick={() => setOpen(false)} />
          <PickerDropdown
            ref={dropdownRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
          >
            {!selectedField ? (
              <>
                <PickerHeader>Select field</PickerHeader>
                {fields.map((f) => (
                  <PickerItem key={f} onClick={() => setSelectedField(f)}>
                    {FIELD_LABELS[f] ?? f}
                  </PickerItem>
                ))}
              </>
            ) : (
              <>
                <PickerBack onClick={() => setSelectedField(null)}>
                  <BackIcon /> {FIELD_LABELS[selectedField] ?? selectedField}
                </PickerBack>
                {(fieldValues?.[selectedField] ?? []).map((val) => (
                  <PickerItem
                    key={val}
                    onClick={() => handleSelect(selectedField, val)}
                  >
                    {val}
                  </PickerItem>
                ))}
              </>
            )}
          </PickerDropdown>
        </>
      )}
    </>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
