import type { PlanSkillsTabProps } from './PlanSkillsTab.types';
import {
  Container,
  NoticeBanner,
  SkillCard,
  CardHeader,
  SkillName,
  VersionBadge,
  CardContent,
  EmptyState,
} from './PlanSkillsTab.styles';

export function PlanSkillsTab({ skills }: PlanSkillsTabProps) {
  if (!skills || skills.length === 0) {
    return (
      <Container>
        <EmptyState>No skills were used when creating this plan.</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <NoticeBanner>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        These skills were included when creating this plan. They provided additional context and instructions to the AI during plan generation.
      </NoticeBanner>

      {skills.map((skill) => (
        <SkillCard key={skill.version_id}>
          <CardHeader>
            <SkillName>{skill.skill_name}</SkillName>
            <VersionBadge>v{skill.version}</VersionBadge>
          </CardHeader>
          <CardContent>{skill.content}</CardContent>
        </SkillCard>
      ))}
    </Container>
  );
}
