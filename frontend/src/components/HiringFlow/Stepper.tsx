import {
  StepperContainer,
  StepItem,
  StepNumber,
  StepConnector,
} from './Stepper.styles';

const STEPS = ['Compensation', 'Payment Plan', 'Review', 'Complete'] as const;

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <StepperContainer>
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3 | 4;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <span key={label} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <StepConnector $completed={isCompleted} />}
            <StepItem $active={isActive} $completed={isCompleted}>
              <StepNumber $active={isActive} $completed={isCompleted}>
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stepNum
                )}
              </StepNumber>
              {label}
            </StepItem>
          </span>
        );
      })}
    </StepperContainer>
  );
}
