import { useState, useRef, useEffect, useCallback } from 'react';
import { ArtifactCard } from '../ArtifactCard/ArtifactCard';
import { usePlan } from '../../actions/plans';
import { PlanTakeover } from '../PlanTakeover/PlanTakeover';
import type { ArtifactsTabProps } from './ArtifactsTab.types';
import { Container, EmptyState } from './ArtifactsTab.styles';
import { artifactDisplayName, isPayoutArtifact } from '../../utils/artifactLabels';
import styled from 'styled-components';

const PeriodBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  margin-bottom: 0;
  flex-wrap: wrap;
`;

const PeriodControls = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SearchInput = styled.input`
  min-width: 220px;
  padding: 6px 12px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  color: #1a1a2e;
  background: #fff;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1);
  }
`;

const DropdownWrapper = styled.div`
  position: relative;
  min-width: 180px;
`;

const DropdownTrigger = styled.button<{ $open?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid ${(p) => (p.$open ? '#5b1647' : '#d1d5db')};
  border-radius: 6px;
  background: #fff;
  color: #1a1a2e;
  cursor: pointer;
  gap: 8px;
  transition: border-color 0.15s;

  &:hover {
    border-color: #5b1647;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: #6b7280;
    transition: transform 0.15s;
    transform: ${(p) => (p.$open ? 'rotate(180deg)' : 'rotate(0)')};
  }
`;

const DropdownMenu = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
`;

const DropdownItem = styled.li<{ $active?: boolean }>`
  padding: 8px 12px;
  font-size: 13px;
  color: ${(p) => (p.$active ? '#5b1647' : '#1a1a2e')};
  background: ${(p) => (p.$active ? '#fdf2f8' : 'transparent')};
  font-weight: ${(p) => (p.$active ? '500' : '400')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &:hover {
    background: ${(p) => (p.$active ? '#fdf2f8' : '#f3f4f6')};
  }

  svg {
    width: 14px;
    height: 14px;
    color: #5b1647;
    flex-shrink: 0;
  }
`;

interface DropdownOption {
  value: string;
  label: string;
}

function PeriodDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
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

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <DropdownWrapper ref={wrapperRef}>
      <DropdownTrigger $open={open} onClick={() => setOpen((o) => !o)} type="button">
        {selectedLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </DropdownTrigger>
      {open && (
        <DropdownMenu>
          {options.map((opt) => (
            <DropdownItem
              key={opt.value}
              $active={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
              {opt.value === value && (
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

export function ArtifactsTab({ artifacts, planId, cycles }: ArtifactsTabProps) {
  const { data: planData } = usePlan(planId);
  const hasCycles = cycles && cycles.length > 0;
  const defaultCycleId = hasCycles ? cycles[cycles.length - 1].cycle_id : undefined;
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(defaultCycleId);
  const [takeoverArtifactName, setTakeoverArtifactName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'most_recent' | 'highest_value'>('most_recent');

  if (artifacts.length === 0) {
    return (
      <Container>
        <EmptyState>
          No artifacts yet. Use the chat to generate SQL artifacts for this plan.
        </EmptyState>
      </Container>
    );
  }

  const periodOptions: DropdownOption[] = [
    ...(hasCycles ? cycles.map((c) => ({ value: c.cycle_id, label: c.period_name })) : []),
    { value: '', label: 'All Periods' },
  ];

  const sortOptions: DropdownOption[] = [
    { value: 'most_recent', label: 'Most recent' },
    { value: 'highest_value', label: 'Highest value' },
  ];

  const term = searchTerm.trim().toLowerCase();
  const searchedArtifacts = term
    ? artifacts.filter((artifact) => {
        const label = artifactDisplayName(artifact.name ?? '').toLowerCase();
        const raw = (artifact.name ?? '').toLowerCase();
        return label.includes(term) || raw.includes(term);
      })
    : artifacts;
  const visibleArtifacts = sortMode === 'highest_value'
    ? [...searchedArtifacts].sort((a, b) => Number(isPayoutArtifact(b.name)) - Number(isPayoutArtifact(a.name)))
    : searchedArtifacts;

  return (
    <Container>
      <PeriodBar>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tables..."
          spellCheck={false}
        />
        {hasCycles && (
          <PeriodControls>
          <PeriodDropdown
            value={selectedCycleId || ''}
            options={periodOptions}
            onChange={(val) => setSelectedCycleId(val || undefined)}
          />
            <PeriodDropdown
              value={sortMode}
              options={sortOptions}
              onChange={(val) => setSortMode(val as 'most_recent' | 'highest_value')}
            />
          </PeriodControls>
        )}
      </PeriodBar>
      {visibleArtifacts.length === 0 && (
        <EmptyState>No matching tables.</EmptyState>
      )}
      {visibleArtifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.artifact_id}
          artifact={artifact}
          planId={planId}
          cycleId={selectedCycleId}
          onExpand={setTakeoverArtifactName}
        />
      ))}
      {takeoverArtifactName && planData && (
        <PlanTakeover
          plan={planData}
          initialArtifactName={takeoverArtifactName}
          onClose={() => setTakeoverArtifactName(null)}
        />
      )}
    </Container>
  );
}
