import styled from 'styled-components';

export const Bar = styled.header`
  height: 48px;
  background: #5b1647;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  color: #fff;
  font-size: 14px;
  z-index: 50;
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
`;

export const LogoIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
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

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const IconButton = styled.button`
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

export const Avatar = styled.div`
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
