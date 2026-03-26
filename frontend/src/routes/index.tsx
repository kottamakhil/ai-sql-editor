import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { PlansLanding } from '../containers/PlansLanding/PlansLanding';
import { PlanDetail } from '../containers/PlanDetail/PlanDetail';

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
        path: '*',
        element: <Navigate to="/variable-compensation/plans" replace />,
      },
    ],
  },
]);
