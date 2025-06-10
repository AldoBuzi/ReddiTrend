import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import getTopNodes from '../services/getTopNodes'
const SyncStatus = ({ setGraph }) => {
  const REFRESH_INTERVAL = 180; // seconds (3 minutes)

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
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
        <Card
            bg={isSynching ? 'secondary' : 'success'}
            text="white"
            className="text-center d-flex align-items-center justify-content-center"
            style={{
            width: '145px',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
            marginBottom: '4px',
            borderRadius: '12px',
            }}
        >
            <Card.Body
            className="d-flex align-items-center justify-content-center flex-nowrap"
            style={{ padding: '0.25rem 0.75rem' }}
            >
            {isSynching ? (
                <>
                Syncing
                <Spinner animation="border" size="sm" className="ms-2" />
                </>
            ) : (
                <>
                Synced
                <FaCheckCircle className="ms-2" />
                </>
            )}
            </Card.Body>
        </Card>
        <Card
            className="text-center d-flex align-items-center justify-content-center"
            style={{
            width: '145px',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
            borderRadius: '12px',
            }}
        >
            <Card.Body style={{ padding: '0.25rem 0.75rem' }}>
            Refresh in: {secondsLeft}s
            </Card.Body>
        </Card>
        </div>



  );
};

export default SyncStatus;
