import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 24px;
`;

const Card = styled.div`
  max-width: 520px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  color: #6b21a8;
  font-size: 13px;
  font-weight: 500;
`;

const Heading = styled.h1`
  font-size: 26px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
`;

const Description = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0;
`;

export function PlansLanding() {
  return (
    <Container>
      <Card>
        <Badge>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 21 12 16.5 5.8 21l2.4-7.1L2 9.4h7.6L12 2z" strokeLinejoin="round" />
          </svg>
          AI-Powered Planning
        </Badge>
        <Heading>Welcome to Variable Compensation</Heading>
        <Description>
          Tell us about the variable compensation plans at your company.
          Click <strong>"+ New plan"</strong> in the sidebar to get started.
          We'll help you build, iterate, and manage your plans using AI.
        </Description>
      </Card>
    </Container>
  );
}
