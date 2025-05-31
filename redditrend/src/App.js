import './App.css';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import redditLogo from './assets/reddit-logo.svg';
import LightDarkThemeToggle from './components/LightDarkThemeToggle';
import SearchBar from './components/SearchBar';
import Graph from './components/Graph';

function App() {
  return (
    <>
      <Navbar>
        <Container>
          <Navbar.Brand>
            <img
              src={redditLogo}
              width="30"
              height="30"
              className="me-2"
            />
            ReddiTrend
          </Navbar.Brand>
          <Nav>
            <LightDarkThemeToggle />
          </Nav>
        </Container>
      </Navbar>
      <SearchBar />
      <Graph />
    </>
  );
}

export default App;
