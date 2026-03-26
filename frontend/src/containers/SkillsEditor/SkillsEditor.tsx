import { useState } from 'react';
import styled from 'styled-components';
import type { Skill } from '../../types';
import { useSkills, useCreateSkill } from '../../actions/plans';

const Container = styled.div`
  display: flex;
  height: 100%;
`;

const ListPanel = styled.div`
  width: 260px;
  min-width: 260px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fafafa;
`;

const ListHeader = styled.div`
  padding: 20px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
`;

const ListTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

const NewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #1a1a2e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #f9fafb; border-color: #9ca3af; }
  svg { width: 14px; height: 14px; }
`;

const SkillList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const SkillItem = styled.button<{ $active?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  border: none;
  background: ${(p) => (p.$active ? '#fff' : 'transparent')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#374151')};
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  cursor: pointer;
  border-left: 3px solid ${(p) => (p.$active ? '#5b1647' : 'transparent')};
  &:hover { background: ${(p) => (p.$active ? '#fff' : '#f3f4f6')}; }
`;

const EditorPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const EditorTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

const SaveBtn = styled.button<{ $disabled?: boolean }>`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$disabled ? '#d1d5db' : '#5b1647')};
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  &:hover { background: ${(p) => (p.$disabled ? '#d1d5db' : '#4a1239')}; }
`;

const EditorBody = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  display: block;
`;

const NameInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #5b1647; box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1); }
  &:read-only { background: #f9fafb; color: #6b7280; }
`;

const ContentEditor = styled.textarea`
  flex: 1;
  min-height: 300px;
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1a1a2e;
  resize: none;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #5b1647; box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1); }
  &:read-only { background: #f9fafb; color: #6b7280; }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 12px;
  padding: 48px;
  text-align: center;

  svg { width: 48px; height: 48px; color: #d1d5db; }
  h3 { font-size: 16px; font-weight: 500; color: #6b7280; margin: 0; }
  p { font-size: 13px; margin: 0; }
`;

const StatusBar = styled.div`
  padding: 8px 24px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;
`;

type EditorMode = { kind: 'idle' } | { kind: 'view'; skill: Skill } | { kind: 'create' };

export function SkillsEditor() {
  const { data: skills, isLoading } = useSkills();
  const createMutation = useCreateSkill();

  const [mode, setMode] = useState<EditorMode>({ kind: 'idle' });
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleSelectSkill = (skill: Skill) => {
    setMode({ kind: 'view', skill });
    setName(skill.name);
    setContent(skill.content);
  };

  const handleNewSkill = () => {
    setMode({ kind: 'create' });
    setName('');
    setContent('');
  };

  const handleCreate = () => {
    if (!name.trim() || !content.trim() || createMutation.isPending) return;
    createMutation.mutate(
      { name: name.trim(), content: content.trim() },
      {
        onSuccess: (created) => {
          setMode({ kind: 'view', skill: created });
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mode.kind === 'create') {
      e.preventDefault();
      handleCreate();
    }
  };

  const isEditing = mode.kind === 'create';
  const activeSkillId = mode.kind === 'view' ? mode.skill.skill_id : null;

  return (
    <Container>
      <ListPanel>
        <ListHeader>
          <ListTitle>Skills</ListTitle>
          <NewBtn onClick={handleNewSkill}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New
          </NewBtn>
        </ListHeader>
        <SkillList>
          {isLoading && (
            <SkillItem as="div" style={{ color: '#9ca3af', cursor: 'default' }}>
              Loading...
            </SkillItem>
          )}
          {skills?.map((skill) => (
            <SkillItem
              key={skill.skill_id}
              $active={skill.skill_id === activeSkillId}
              onClick={() => handleSelectSkill(skill)}
            >
              {skill.name}
            </SkillItem>
          ))}
          {!isLoading && skills?.length === 0 && (
            <SkillItem as="div" style={{ color: '#9ca3af', cursor: 'default', borderLeft: 'none' }}>
              No skills yet
            </SkillItem>
          )}
        </SkillList>
      </ListPanel>

      <EditorPanel>
        {mode.kind === 'idle' && (
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>Select or create a skill</h3>
            <p>
              Skills are instructions injected into AI prompts to guide how compensation plans are built.
              Select a skill from the list or click <strong>"+ New"</strong> to create one.
            </p>
          </EmptyState>
        )}

        {mode.kind !== 'idle' && (
          <>
            <EditorHeader>
              <EditorTitle>
                {isEditing ? 'New Skill' : name}
              </EditorTitle>
              {isEditing && (
                <SaveBtn
                  $disabled={!name.trim() || !content.trim() || createMutation.isPending}
                  onClick={handleCreate}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </SaveBtn>
              )}
            </EditorHeader>
            <EditorBody onKeyDown={handleKeyDown}>
              <div>
                <FieldLabel>Name</FieldLabel>
                <NameInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Commission Calculation Rules"
                  readOnly={!isEditing}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <FieldLabel>Content</FieldLabel>
                <ContentEditor
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the skill content that will be injected into AI prompts..."
                  readOnly={!isEditing}
                />
              </div>
            </EditorBody>
            <StatusBar>
              {isEditing
                ? createMutation.isError
                  ? 'Error creating skill'
                  : 'Cmd+Enter to create'
                : `Skill ID: ${mode.kind === 'view' ? mode.skill.skill_id : ''}`}
            </StatusBar>
          </>
        )}
      </EditorPanel>
    </Container>
  );
}
