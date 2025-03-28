import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const EmotionDetection = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [emotion, setEmotion] = useState('');
  const [userId, setUserId] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Load models and start video
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      
      startVideo();
    };
    
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => console.error(err));
  };

  // Detect emotions in real-time
  const detectEmotions = async () => {
    const detection = await faceapi.detectAllFaces(
      videoRef.current, 
      new faceapi.TinyFaceDetectorOptions()
    )
    .withFaceLandmarks()
    .withFaceExpressions();

    if (detection.length > 0) {
      const expressions = detection[0].expressions;
      const dominantEmotion = Object.entries(expressions).reduce(
        (max, [emotion, value]) => value > max[1] ? [emotion, value] : max,
        ['neutral', 0]
      )[0];
      
      setEmotion(dominantEmotion);
      
      // Store in Supabase if call is active
      if (isCallActive && userId) {
        await supabase
          .from('hr_users')
          .update({ current_emotion: dominantEmotion })
          .eq('id', userId);
      }
    }

    requestAnimationFrame(detectEmotions);
  };

  // Start/stop emotion detection
  const toggleCall = () => {
    setIsCallActive(!isCallActive);
    if (!isCallActive) {
      detectEmotions();
    }
  };

  return (
    <div className="emotion-detection">
      <h1>HR Emotion Detection</h1>
      
      <div className="video-container">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          width="720" 
          height="560"
        />
        <canvas ref={canvasRef} width="720" height="560" />
      </div>
      
      <div className="controls">
        <p>Detected Emotion: <strong>{emotion}</strong></p>
        <button onClick={toggleCall}>
          {isCallActive ? 'End Call' : 'Start Call'}
        </button>
      </div>
      
      {/* Add user selection from Supabase */}
      <UserSelector setUserId={setUserId} />
    </div>
  );
};

const UserSelector = ({ setUserId }) => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('hr_users')
        .select('*');
      
      if (data) setUsers(data);
    };
    
    fetchUsers();
  }, []);

  return (
    <select onChange={(e) => setUserId(e.target.value)}>
      <option value="">Select HR User</option>
      {users.map(user => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
};

export default EmotionDetection;