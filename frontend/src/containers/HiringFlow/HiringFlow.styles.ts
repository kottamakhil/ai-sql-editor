import styled from 'styled-components';

export const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 700px;
`;

export const PageHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  svg {
    width: 20px;
    height: 20px;
    color: #6b7280;
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }
`;
