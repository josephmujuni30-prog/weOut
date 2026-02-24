import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EventDetails = () => {
  // useParams grabs the ":id" part from the URL
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '20px', cursor: 'pointer' }}
      >
        ← Back to Events
      </button>
      
      <div style={{ border: '1px solid #ccc', padding: '40px', borderRadius: '8px' }}>
        <h1>Event Details</h1>
        <p>You are viewing details for Event ID: <strong>{id}</strong></p>
        <p style={{ color: '#666' }}>
          Next step: We will connect this ID to Firestore to pull the event's name, image, and description!
        </p>
      </div>
    </div>
  );
};

export default EventDetails;