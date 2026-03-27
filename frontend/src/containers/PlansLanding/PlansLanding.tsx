import { Container, Card, Badge, Heading, Description } from './PlansLanding.styles';

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
