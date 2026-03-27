import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeProps,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePlanLineage } from '../../actions/plans';
import type { LineageTabProps } from './LineageTab.types';
import type { LineageNodeData } from './LineageTab.helpers';
import { buildLineageGraph } from './LineageTab.helpers';
import { Container, EmptyState, SourceNode, ArtifactNode } from './LineageTab.styles';

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

const handleStyle = { width: 6, height: 6, background: '#5b1647', border: 'none' };

function LineageNodeComponent({ data }: NodeProps<Node<LineageNodeData>>) {
  if (data.nodeType === 'source') {
    return (
      <>
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <SourceNode>
          <DatabaseIcon />
          {data.label}
        </SourceNode>
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </>
    );
  }

  return (
    <>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <ArtifactNode>
        <CodeIcon />
        {data.label}
      </ArtifactNode>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </>
  );
}

const nodeTypes = { lineageNode: LineageNodeComponent };

const defaultEdgeOptions = {
  style: { stroke: '#5b1647', strokeWidth: 1.5 },
};

export function LineageTab({ planId }: LineageTabProps) {
  const { data: lineage, isLoading, isError } = usePlanLineage(planId);

  const graph = useMemo(() => {
    if (!lineage || lineage.nodes.length === 0) return null;
    return buildLineageGraph(lineage);
  }, [lineage]);

  const minimapNodeColor = useCallback(
    (node: Node<LineageNodeData>) =>
      node.data.nodeType === 'artifact' ? '#5b1647' : '#9ca3af',
    [],
  );

  if (isLoading) {
    return <EmptyState>Loading lineage...</EmptyState>;
  }

  if (isError) {
    return <EmptyState>Failed to load lineage data.</EmptyState>;
  }

  if (!graph) {
    return (
      <EmptyState>
        No artifacts yet. Use the chat to generate SQL artifacts to view lineage.
      </EmptyState>
    );
  }

  return (
    <Container>
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0,0,0,0.08)"
          style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
      </ReactFlow>
    </Container>
  );
}
