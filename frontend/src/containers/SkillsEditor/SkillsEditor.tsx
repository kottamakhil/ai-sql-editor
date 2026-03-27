import { useState } from 'react';
import type { Skill } from '../../types';
import { useSkills, useCreateSkill, useUpdateSkill } from '../../actions/plans';
import type { EditorMode } from './SkillsEditor.types';
import {
  Container,
  ListPanel,
  ListHeader,
  ListTitle,
  NewBtn,
  SkillList,
  SkillItem,
  EditorPanel,
  EditorHeader,
  EditorTitle,
  SaveBtn,
  EditorBody,
  FieldLabel,
  NameInput,
  ContentEditor,
  EmptyState,
  StatusBar,
} from './SkillsEditor.styles';

export function SkillsEditor() {
  const { data: skills, isLoading } = useSkills();
  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();

  const [mode, setMode] = useState<EditorMode>({ kind: 'idle' });
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleSelectSkill = (skill: Skill) => {
    setMode({ kind: 'view', skill });
    setName(skill.name);
    setContent(skill.content);
    updateMutation.reset();
  };

  const handleNewSkill = () => {
    setMode({ kind: 'create' });
    setName('');
    setContent('');
    updateMutation.reset();
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

  const handleUpdate = () => {
    if (mode.kind !== 'view' || !name.trim() || !content.trim() || updateMutation.isPending) return;
    updateMutation.mutate(
      { skillId: mode.skill.skill_id, data: { name: name.trim(), content: content.trim() } },
      {
        onSuccess: (updated) => {
          setMode({ kind: 'view', skill: updated });
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (mode.kind === 'create') handleCreate();
      else if (mode.kind === 'view') handleUpdate();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (mode.kind === 'view') handleUpdate();
      else if (mode.kind === 'create') handleCreate();
    }
  };

  const isCreating = mode.kind === 'create';
  const activeSkillId = mode.kind === 'view' ? mode.skill.skill_id : null;
  const hasChanges = mode.kind === 'view'
    ? name !== mode.skill.name || content !== mode.skill.content
    : false;

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
                {isCreating ? 'New Skill' : name}
              </EditorTitle>
              {isCreating ? (
                <SaveBtn
                  $disabled={!name.trim() || !content.trim() || createMutation.isPending}
                  onClick={handleCreate}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </SaveBtn>
              ) : (
                <SaveBtn
                  $disabled={!hasChanges || !name.trim() || !content.trim() || updateMutation.isPending}
                  onClick={handleUpdate}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
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
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <FieldLabel>Content</FieldLabel>
                <ContentEditor
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the skill content that will be injected into AI prompts..."
                />
              </div>
            </EditorBody>
            <StatusBar>
              {isCreating
                ? createMutation.isError
                  ? 'Error creating skill'
                  : 'Cmd+Enter to create'
                : updateMutation.isPending
                  ? 'Saving...'
                  : updateMutation.isSuccess && !hasChanges
                    ? 'Saved'
                    : updateMutation.isError
                      ? 'Error saving'
                      : hasChanges
                        ? 'Unsaved changes · Cmd+S to save'
                        : 'Cmd+S to save'}
            </StatusBar>
          </>
        )}
      </EditorPanel>
    </Container>
  );
}
