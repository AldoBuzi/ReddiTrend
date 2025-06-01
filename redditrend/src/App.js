import './App.css';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import redditLogo from './assets/reddit-logo.svg';
import SigmaGraph from './components/SigmaGraph';

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
            <div>
                <input type="checkbox" className="checkbox" id="checkbox" />
                <label htmlFor="checkbox" className="checkbox-label" >
                    <i class="fas fa-moon"></i>
                    <i class="fas fa-sun"></i>
                    <span class="ball"></span>
                </label>
            </div>
          </Nav>
        </Container>
      </Navbar>
      <SigmaGraph />
    </>
  );
}

export default App;
