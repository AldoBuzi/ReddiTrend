import './App.css';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import redditLogo from './assets/reddit-logo.svg';
import SigmaGraph from './components/SigmaGraph';
import { useEffect, useRef, useState, useCallback, createContext } from 'react'

export const DarkModeContext = createContext(false)

function App() {
  const [darkMode, setDarkMode] = useState(false)
  
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark")
    }
    else {
      document.body.classList.remove("dark")
    }
  }, [darkMode])

  return (
    <DarkModeContext.Provider value={darkMode}>
      <Navbar>
        <Container>
          <Navbar.Brand className={`${darkMode ? "text-white" : ""}`}>
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
                <input onChange={() => {setDarkMode(!darkMode)}} type="checkbox" className="checkbox" id="checkbox" />
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
    </DarkModeContext.Provider>
  );
}

export default App;
