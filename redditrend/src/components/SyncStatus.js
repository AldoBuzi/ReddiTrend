import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import getTopNodes from '../services/getTopNodes'
const SyncStatus = ({ setGraph }) => {
  const REFRESH_INTERVAL = 60; // seconds

  const [isSynching, setIsSynching] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_INTERVAL);

  // Simulate syncing logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === 1) {
          // Trigger sync
          setIsSynching(true);
          getTopNodes().then(res => {
            console.log("Graph set")
            setGraph(res)
            setIsSynching(false);
          }).catch(error => alert(error))
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="position-absolute top-0 end-0 m-5">
        <Card
            bg={isSynching ? 'secondary' : 'success'}
            text="white"
            className="text-center d-flex align-items-center justify-content-center mb-2 rounded-3"
        >
            <Card.Body
            className="d-flex align-items-center justify-content-center flex-nowrap py-2"
            >
            {isSynching ? (
                <>
                Syncing
                <Spinner animation="border" size="sm" className="ms-2" />
                </>
            ) : (
                <>
                Synced
                <i className="ms-2 bi bi-check-circle-fill"></i>
                </>
            )}
            </Card.Body>
        </Card>
        <Card
            className="text-center d-flex align-items-center justify-content-center rounded-3"
        >
            <Card.Body>
            Refresh in: {secondsLeft}s
            </Card.Body>
        </Card>
        </div>



  );
};

export default SyncStatus;
