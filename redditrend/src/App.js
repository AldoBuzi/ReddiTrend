import './App.css';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import redditLogo from './assets/reddit-logo.svg';
import SigmaGraph from './components/SigmaGraph';
import { useEffect, useRef, useState, useCallback, createContext } from 'react'
import getTopNodes from './services/getTopNodes'
import isEmpty from './utils/isEmpty'

export const DarkModeContext = createContext(false)

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [graph, setGraph] = useState({})

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark")
    }
    else {
      document.body.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    getTopNodes().then(res => {
      setGraph(res)
    }).catch(error => alert(error))
  }, []) 

  return (
    <DarkModeContext.Provider value={darkMode}>
      <Navbar className="">
        <Container>
          <Navbar.Brand className={`${darkMode ? "text-white" : ""} z-1`}>
            <img
              src={redditLogo}
              width="30"
              height="30"
              className="me-2"
            />
            ReddiTrend
          </Navbar.Brand>
          {/*<Nav>
            <div>
                <input onChange={() => {setDarkMode(!darkMode)}} type="checkbox" className="checkbox" id="checkbox" />
                <label htmlFor="checkbox" className="checkbox-label" >
                    <i className="fas fa-moon"></i>
                    <i className="fas fa-sun"></i>
                    <span className="ball"></span>
                </label>
            </div>
          </Nav>*/}
        </Container>
      </Navbar>
      {!isEmpty(graph) && <SigmaGraph
        graphData = {graph}
      />}
    </DarkModeContext.Provider>
  );
}

export default App;
