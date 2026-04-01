import styled from 'styled-components';

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
`;

export const TopBar = styled.header`
  height: 48px;
  background: #5b1647;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  color: #fff;
  font-size: 14px;
  z-index: 50;
  flex-shrink: 0;
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const AppName = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;

  svg {
    width: 12px;
    height: 12px;
    opacity: 0.6;
  }
`;

export const SearchWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 6px 14px;
  width: 360px;
  max-width: 100%;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const RightIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const IconBtn = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const CompanyName = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
`;

export const AvatarCircle = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e9a820;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
`;

export const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const MainContent = styled.main`
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
