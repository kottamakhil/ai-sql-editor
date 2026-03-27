import Dagre from '@dagrejs/dagre';
import { MarkerType, type Node, type Edge } from '@xyflow/react';
import type { LineageDAG } from '../../types';

export interface LineageNodeData extends Record<string, unknown> {
  label: string;
  nodeType: 'source' | 'artifact';
  artifactType: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 48;

export function buildLineageGraph(dag: LineageDAG): {
  nodes: Node<LineageNodeData>[];
  edges: Edge[];
} {
  const nodeIds = new Set(dag.nodes.map((n) => n.id));

  const rfNodes: Node<LineageNodeData>[] = dag.nodes.map((n) => ({
    id: n.id,
    type: 'lineageNode',
    position: { x: 0, y: 0 },
    data: {
      label: n.name ?? n.id,
      nodeType: 'artifact' as const,
      artifactType: n.type,
    },
  }));

  const sourceNodes = new Map<string, Node<LineageNodeData>>();

  const rfEdges: Edge[] = [];
  for (const e of dag.edges) {
    if (!nodeIds.has(e.source) && !sourceNodes.has(e.source)) {
      sourceNodes.set(e.source, {
        id: e.source,
        type: 'lineageNode',
        position: { x: 0, y: 0 },
        data: {
          label: e.source,
          nodeType: 'source',
          artifactType: 'table',
        },
      });
    }

    rfEdges.push({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#5b1647', width: 16, height: 16 },
    });
  }

  const allNodes = [...sourceNodes.values(), ...rfNodes];

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

  for (const node of allNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of rfEdges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  const positioned: Node<LineageNodeData>[] = allNodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: positioned, edges: rfEdges };
}
