import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout/AppLayout';
import { PlansLanding } from '../containers/PlansLanding/PlansLanding';
import { PlanDetail } from '../containers/PlanDetail/PlanDetail';
import { SkillsEditor } from '../containers/SkillsEditor/SkillsEditor';
import { PlanTemplateEditor } from '../containers/PlanTemplateEditor/PlanTemplateEditor';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/variable-compensation/plans',
        element: <PlansLanding />,
      },
      {
        path: '/variable-compensation/plans/:planId',
        element: <PlanDetail />,
      },
      {
        path: '/variable-compensation/skills',
        element: <SkillsEditor />,
      },
      {
        path: '/variable-compensation/plan-templates',
        element: <PlanTemplateEditor />,
      },
      {
        path: '*',
        element: <Navigate to="/variable-compensation/plans" replace />,
      },
    ],
  },
]);
