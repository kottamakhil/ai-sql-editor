import { useState } from 'react';
import type { PlanTemplate } from '../../types';
import { usePlanTemplates, useCreatePlanTemplate, useUpdatePlanTemplate } from '../../actions/plans';
import type { EditorMode } from './PlanTemplateEditor.types';
import {
  Container,
  ListPanel,
  ListHeader,
  ListTitle,
  NewBtn,
  TemplateList,
  TemplateItem,
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
} from './PlanTemplateEditor.styles';

export function PlanTemplateEditor() {
  const { data: templates, isLoading } = usePlanTemplates();
  const createMutation = useCreatePlanTemplate();
  const updateMutation = useUpdatePlanTemplate();

  const [mode, setMode] = useState<EditorMode>({ kind: 'idle' });
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  if (mode.kind === 'idle' && templates && templates.length > 0) {
    const first = templates[0];
    setMode({ kind: 'view', template: first });
    setName(first.name);
    setContent(first.content);
  }

  const handleSelectTemplate = (tpl: PlanTemplate) => {
    setMode({ kind: 'view', template: tpl });
    setName(tpl.name);
    setContent(tpl.content);
    updateMutation.reset();
  };

  const handleNewTemplate = () => {
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
          setMode({ kind: 'view', template: created });
        },
      },
    );
  };

  const handleUpdate = () => {
    if (mode.kind !== 'view' || !name.trim() || !content.trim() || updateMutation.isPending) return;
    updateMutation.mutate(
      { templateId: mode.template.template_id, data: { name: name.trim(), content: content.trim() } },
      {
        onSuccess: (updated) => {
          setMode({ kind: 'view', template: updated });
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
  const activeTemplateId = mode.kind === 'view' ? mode.template.template_id : null;
  const hasChanges = mode.kind === 'view'
    ? name !== mode.template.name || content !== mode.template.content
    : false;

  return (
    <Container>
      <ListPanel>
        <ListHeader>
          <ListTitle>Templates</ListTitle>
          <NewBtn onClick={handleNewTemplate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New
          </NewBtn>
        </ListHeader>
        <TemplateList>
          {isLoading && (
            <TemplateItem as="div" style={{ color: '#9ca3af', cursor: 'default' }}>
              Loading...
            </TemplateItem>
          )}
          {templates?.map((tpl) => (
            <TemplateItem
              key={tpl.template_id}
              $active={tpl.template_id === activeTemplateId}
              onClick={() => handleSelectTemplate(tpl)}
            >
              {tpl.name}
            </TemplateItem>
          ))}
          {!isLoading && templates?.length === 0 && (
            <TemplateItem as="div" style={{ color: '#9ca3af', cursor: 'default', borderLeft: 'none' }}>
              No templates yet
            </TemplateItem>
          )}
        </TemplateList>
      </ListPanel>

      <EditorPanel>
        {mode.kind === 'idle' && (
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>Select or create a template</h3>
            <p>
              Plan configuration templates define the JSON structure that the AI uses to infer
              plan settings during creation. Select a template from the list or click <strong>"+ New"</strong> to create one.
            </p>
          </EmptyState>
        )}

        {mode.kind !== 'idle' && (
          <>
            <EditorHeader>
              <EditorTitle>
                {isCreating ? 'New Template' : name}
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
                  placeholder="e.g. Standard Commission Config"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <FieldLabel>Content (YAML)</FieldLabel>
                <ContentEditor
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={'payout:\n  is_automatic_payout_enabled: false\n  final_payment_offset: null\npayroll:\n  payout_type: null\ndisputes:\n  is_disputes_enabled: true'}
                />
              </div>
            </EditorBody>
            <StatusBar>
              {isCreating
                ? createMutation.isError
                  ? 'Error creating template'
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
