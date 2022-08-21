import styled from "@xstyled/styled-components";
import { FadeLink } from "./Link";

export const Navbar = styled.nav`
  padding: 5 3 4;
  max-width: container;
  margin: 0 auto;
  display: flex;
  align-items: center;
`;

export const NavbarBrandLink = styled(FadeLink)`
  flex: 1 0;
`;

export const NavbarBrand = styled.h1`
  font-size: xl;
  color: white;
  display: flex;
  align-items: center;
  font-weight: normal;
  margin: 0;
  text-decoration: none;
`;

export const NavbarSecondary = styled.div`
  flex-shrink: 0;
`;
