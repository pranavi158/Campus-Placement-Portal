import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../config/socket';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Code2,
  Copy,
  Check,
  RotateCcw,
  Users,
  AlertCircle
} from 'lucide-react';
import Toast from '../components/Toast';

const STARTER_TEMPLATES = {
  javascript: {
    blank: `// Write your JavaScript solution here\nfunction solution(input) {\n  console.log("Input:", input);\n  return input;\n}\n\nconsole.log(solution("test"));\n`,
    twoSum: `/**\n * Problem: Two Sum\n * Given an array of integers nums and an integer target, return indices\n * of the two numbers such that they add up to target.\n */\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\n// Test Case\nconsole.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]\n`,
    validParens: `/**\n * Problem: Valid Parentheses\n * Given a string s containing '(', ')', '{', '}', '[' and ']',\n * determine if the input string is valid.\n */\nfunction isValid(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  \n  for (const char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else {\n      if (stack.pop() !== pairs[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}\n\nconsole.log(isValid("()[]{}")); // Expected: true\nconsole.log(isValid("(]"));     // Expected: false\n`
  },
  python: {
    blank: `# Write your Python solution here\ndef solution(data):\n    print("Processing:", data)\n    return data\n\nprint(solution("test"))\n`,
    twoSum: `def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n\n# Test Case\nprint(two_sum([2, 7, 11, 15], 9)) # Output: [0, 1]\n`,
    validParens: `def is_valid(s):\n    stack = []\n    pairs = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in pairs.values():\n            stack.append(char)\n        elif char in pairs:\n            if not stack or stack.pop() != pairs[char]:\n                return False\n    return len(stack) == 0\n\nprint(is_valid("()[]{}")) # Output: True\n`
  },
  cpp: {
    blank: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "Live Interview C++ Session" << endl;\n    return 0;\n}\n`,
    twoSum: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> map;\n    for (int i = 0; i < nums.size(); i++) {\n        int complement = target - nums[i];\n        if (map.find(complement) != map.end()) {\n            return {map[complement], i};\n        }\n        map[nums[i]] = i;\n    }\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    vector<int> res = twoSum(nums, 9);\n    cout << "[" << res[0] << ", " << res[1] << "]" << endl;\n    return 0;\n}\n`
  },
  java: {
    blank: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Live Interview Java Session");\n    }\n}\n`,
    twoSum: `import java.util.HashMap;\nimport java.util.Arrays;\n\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n\n    public static void main(String[] args) {\n        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));\n    }\n}\n`
  }
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const InterviewRoom = () => {
  const { roomId } = useParams();
  const { user, apiCall } = useAuth();
  const navigate = useNavigate();

  // Interview Metadata & Room State
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [roomDuration, setRoomDuration] = useState(0);

  // Collaborative Code Editor State
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [selectedTemplate, setSelectedTemplate] = useState('twoSum');
  const [isCodeSynced, setIsCodeSynced] = useState(true);

  // WebRTC & Media States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [connectionState, setConnectionState] = useState('new');

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const codeSaveTimeoutRef = useRef(null);
  const localStreamRef = useRef(null);
  // Prevents the WebRTC+socket effect from running more than once
  const hasInitializedRef = useRef(false);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setRoomDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Fetch Room Metadata from Backend with authorization verification
  useEffect(() => {
    let isMounted = true;

    const fetchRoom = async () => {
      try {
        const res = await apiCall(`/api/interviews/room/${roomId}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok) {
          setInterview(data.interview);
          setCode(data.interview.code || STARTER_TEMPLATES.javascript.twoSum);
          setLanguage(data.interview.language || 'javascript');
        } else {
          setToast({ message: data.message || 'Failed to load interview room', type: 'error' });
        }
      } catch (err) {
        if (isMounted) {
          setToast({ message: err.message, type: 'error' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Initialize WebRTC Media Streams (Audio & Video)
  useEffect(() => {
    let streamInstance = null;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamInstance = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('⚠️ Video+Audio access denied, attempting audio only fallback:', err.message);
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          streamInstance = audioOnlyStream;
          localStreamRef.current = audioOnlyStream;
          setLocalStream(audioOnlyStream);
          setIsCameraOff(true);
        } catch (audioErr) {
          console.warn('⚠️ Camera/Mic permissions not granted:', audioErr.message);
          setMediaError('Camera/Microphone permission denied. Media calling disabled.');
        }
      }
    };

    startMedia();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Bind local video element whenever stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote video element whenever remote stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 3. Socket.io + WebRTC Peer Connection Setup.
  //
  // CRITICAL: We wait until BOTH `interview` AND (`localStream` OR `mediaError`)
  // are resolved before creating the RTCPeerConnection. This guarantees that our
  // media tracks are always present before the first SDP offer/answer exchange,
  // which prevents one-way video where the remote peer never sees our stream.
  //
  // `hasInitializedRef` ensures this effect runs exactly once — mic/camera
  // toggles update `localStream` but do NOT recreate the peer connection.
  useEffect(() => {
    if (!interview || !user) return;
    // Wait until camera is ready OR we know camera is denied (mediaError is set)
    if (!localStream && !mediaError) return;
    // Run only once per room session
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const socket = getSocket();
    socketRef.current = socket;

    // Create RTCPeerConnection with STUN servers
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local media tracks — stream is guaranteed to be available here
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Receive remote peer's media tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Send locally gathered ICE candidates to the peer via Socket.IO
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    // Track P2P connection state for UI badge
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'failed') {
        setToast({ message: 'Peer connection failed. Try refreshing the page.', type: 'error' });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        setToast({ message: 'Peer connection interrupted, attempting to reconnect...', type: 'warning' });
      }
    };

    // Join the Socket.IO interview room
    socket.emit('join-interview-room', { roomId });

    // Caller side: create and send SDP offer when the other peer joins
    const createCallOffer = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { roomId, sdp: offer });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    };

    socket.on('sync-room-state', ({ code: syncedCode, language: syncedLang, participants: pList }) => {
      if (syncedCode !== undefined) setCode(syncedCode);
      if (syncedLang) setLanguage(syncedLang);
      if (pList) setParticipants(pList);
    });

    socket.on('user-joined', ({ user: newUser, participants: pList }) => {
      setToast({ message: `${newUser.name} (${newUser.role}) joined the room`, type: 'info' });
      setParticipants(pList);
      createCallOffer();
    });

    socket.on('user-left', ({ user: leftUser, participants: pList }) => {
      if (leftUser) setToast({ message: `${leftUser.name} disconnected`, type: 'warning' });
      setParticipants(pList);
      setRemoteStream(null);
      setConnectionState('new');
    });

    const iceCandidateQueue = [];

    const flushIceQueue = async () => {
      while (iceCandidateQueue.length > 0) {
        const queuedCandidate = iceCandidateQueue.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err);
        }
      }
    };

    // Callee side: receive offer, create answer with our tracks already attached
    socket.on('webrtc-offer', async ({ sdp }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushIceQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { roomId, sdp: answer });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    socket.on('webrtc-answer', async ({ sdp }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushIceQueue();
      } catch (err) {
        console.error('Error setting remote answer:', err);
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      try {
        if (!candidate) return;
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueue.push(candidate);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('code-change', ({ code: newCode }) => {
      setCode(newCode);
      setIsCodeSynced(true);
    });

    socket.on('language-change', ({ language: newLang }) => {
      setLanguage(newLang);
    });

    socket.on('error', ({ message }) => {
      setToast({ message: message || 'Socket error', type: 'error' });
    });

    return () => {
      hasInitializedRef.current = false;
      socket.emit('leave-interview-room', { roomId });
      socket.off('sync-room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('code-change');
      socket.off('language-change');
      socket.off('error');

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [interview, user, localStream, mediaError, roomId]);

  // Code Change Handler (Debounced Broadcast & Sync)
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    setIsCodeSynced(false);

    if (socketRef.current) {
      socketRef.current.emit('code-change', { roomId, code: newCode });
    }

    // Auto-save to DB with 1500ms debounce
    clearTimeout(codeSaveTimeoutRef.current);
    codeSaveTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('save-code', { roomId, code: newCode, language });
      }
      setIsCodeSynced(true);
    }, 1500);
  };

  // Language Change Handler
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    if (socketRef.current) {
      socketRef.current.emit('language-change', { roomId, language: newLang });
    }

    // Update with template if desired
    if (STARTER_TEMPLATES[newLang]?.[selectedTemplate]) {
      const templateCode = STARTER_TEMPLATES[newLang][selectedTemplate];
      setCode(templateCode);
      if (socketRef.current) {
        socketRef.current.emit('code-change', { roomId, code: templateCode });
      }
    }
  };

  // Apply Problem Template
  const handleApplyTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    const templateCode =
      STARTER_TEMPLATES[language]?.[templateKey] || STARTER_TEMPLATES.javascript[templateKey];
    if (templateCode) {
      setCode(templateCode);
      if (socketRef.current) {
        socketRef.current.emit('code-change', { roomId, code: templateCode });
      }
      setToast({ message: `Loaded ${templateKey} boilerplate`, type: 'info' });
    }
  };

  // Media Controls: Mic Mute / Unmute
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Media Controls: Camera On / Off
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  // Copy Room Link to Clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Exit Room
  const handleLeaveRoom = () => {
    if (user?.role === 'company') {
      navigate('/company');
    } else {
      navigate('/student');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: '1rem',
        }}
      >
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Connecting to technical interview room...</p>
      </div>
    );
  }

  const isCompany = user?.role === 'company';
  const peerParticipant = participants.find((p) => p.id !== user.id);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0.5rem 1rem 2rem' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Top Control Bar ─── */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.75rem 1.25rem',
          marginBottom: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* Drive & Role Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-gold), #8A6D2F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 700,
            }}
          >
            <Code2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {interview?.drive?.title || 'Technical Interview'}
              </h2>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                Round {interview?.roundNumber || 1}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {isCompany
                ? `Candidate: ${interview?.student?.name} (${interview?.student?.branch || 'Student'})`
                : `Company: ${interview?.company?.name || 'Recruiter'}`}
              {' • '}
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Duration: {formatTimer(roomDuration)}</span>
            </p>
          </div>
        </div>

        {/* Room Status & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Peer connection badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: peerParticipant ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: peerParticipant ? 'var(--color-success)' : 'var(--color-warning)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: peerParticipant ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            />
            {peerParticipant ? `${peerParticipant.name} connected` : 'Waiting for peer...'}
          </div>

          {/* Copy Room Link */}
          <button
            onClick={handleCopyLink}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="Copy Interview Room Link"
          >
            {copiedLink ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
            {copiedLink ? 'Copied' : 'Share Link'}
          </button>

          {/* Leave Room Button */}
          <button
            onClick={handleLeaveRoom}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <PhoneOff size={14} /> Exit Room
          </button>
        </div>
      </div>

      {mediaError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          {mediaError}
        </div>
      )}

      {/* ─── Main Workspace Grid ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(340px, 1fr)',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* ─── LEFT: Collaborative Code Editor ─── */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '740px',
            backgroundColor: '#181A20',
            border: '1px solid #2B2F3A',
            color: '#E0E4E8',
          }}
        >
          {/* Editor Header Toolbar */}
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#1E212B',
              borderBottom: '1px solid #2B2F3A',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#C5A059',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <Code2 size={16} /> Shared Code Editor
              </div>

              {/* Language Selector */}
              <select
                value={language}
                onChange={handleLanguageChange}
                style={{
                  background: '#2B2F3A',
                  color: '#FFF',
                  border: '1px solid #3E4452',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (std=c++17)</option>
                <option value="java">Java 17</option>
              </select>

              {/* Preloaded Template Problem */}
              <select
                value={selectedTemplate}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                style={{
                  background: '#2B2F3A',
                  color: '#B0B8C4',
                  border: '1px solid #3E4452',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <option value="twoSum">Problem: Two Sum</option>
                <option value="validParens">Problem: Valid Parentheses</option>
                <option value="blank">Blank Editor</option>
              </select>
            </div>

            {/* Sync & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isCodeSynced ? '#4CAF50' : '#FF9800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isCodeSynced ? '#4CAF50' : '#FF9800',
                  }}
                />
                {isCodeSynced ? 'Synced live' : 'Broadcasting...'}
              </span>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setToast({ message: 'Code copied to clipboard', type: 'info' });
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  background: '#2B2F3A',
                  border: '1px solid #3E4452',
                  color: '#E0E4E8',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                }}
                title="Copy Code"
              >
                <Copy size={12} />
              </button>

              <button
                onClick={() => handleApplyTemplate(selectedTemplate)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: '#2B2F3A',
                  border: '1px solid #3E4452',
                  color: '#E0E4E8',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                }}
                title="Reset boilerplate"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Interactive Code Editor Textarea */}
          <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden' }}>
            <textarea
              value={code}
              onChange={handleCodeChange}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const newCode = code.substring(0, start) + '  ' + code.substring(end);
                  setCode(newCode);
                  if (socketRef.current) {
                    socketRef.current.emit('code-change', { roomId, code: newCode });
                  }
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              spellCheck="false"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#181A20',
                color: '#E0E4E8',
                fontFamily: 'Consolas, "Fira Code", Monaco, "Courier New", Courier, monospace',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                padding: '1rem',
                border: 'none',
                outline: 'none',
                resize: 'none',
                tabSize: 2,
              }}
              placeholder="// Start writing code together in real-time..."
            />
          </div>

          {/* Editor Footer Status */}
          <div
            style={{
              padding: '0.45rem 1rem',
              backgroundColor: '#13151A',
              borderTop: '1px solid #2B2F3A',
              fontSize: '0.75rem',
              color: '#8A919A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>UTF-8 • {language.toUpperCase()} • 2 Spaces</div>
            <div>
              {peerParticipant ? `Collaborating with ${peerParticipant.name}` : 'Waiting for peer to join...'}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Video & Media Controls ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            className="card"
            style={{
              padding: '1rem',
              backgroundColor: '#181A20',
              border: '1px solid #2B2F3A',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E0E4E8', margin: 0 }}>
                WebRTC Video Calling
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: connectionState === 'connected' ? 'var(--color-success-bg)' :
                              connectionState === 'connecting' ? 'var(--color-warning-bg)' :
                              connectionState === 'failed' ? 'var(--color-danger-bg)' : '#2B2F3A',
                  color: connectionState === 'connected' ? 'var(--color-success)' :
                         connectionState === 'connecting' ? 'var(--color-warning)' :
                         connectionState === 'failed' ? 'var(--color-danger)' : '#8A919A',
                  fontWeight: 600,
                }}
              >
                {connectionState === 'connected' ? 'P2P Live' :
                 connectionState === 'connecting' ? 'Connecting...' :
                 connectionState === 'failed' ? 'P2P Failed' : 'P2P Ready'}
              </span>
            </div>

            {/* Remote Peer Stream */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#232733',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #2B2F3A',
              }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: remoteStream ? 'block' : 'none',
                }}
              />
              {!remoteStream && (
                <div style={{ textAlign: 'center', color: '#8A919A', padding: '1rem' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                    }}
                  >
                    {peerParticipant?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ fontWeight: 600, color: '#E0E4E8', fontSize: '0.9rem' }}>
                    {peerParticipant ? peerParticipant.name : 'Waiting for Peer to Join'}
                  </div>
                  <span style={{ fontSize: '0.75rem' }}>
                    {peerParticipant ? `${peerParticipant.role} connected` : 'Share the room link to connect'}
                  </span>
                </div>
              )}
              {peerParticipant && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.65)',
                    color: '#FFF',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {peerParticipant.name} ({peerParticipant.role})
                </div>
              )}
            </div>

            {/* Local User Stream */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#232733',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #2B2F3A',
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror local preview
                  display: isCameraOff ? 'none' : 'block',
                }}
              />
              {isCameraOff && (
                <div style={{ textAlign: 'center', color: '#8A919A' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: '#3E4452',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.4rem',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'Y'}
                  </div>
                  <span style={{ fontSize: '0.75rem' }}>Camera Off</span>
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#FFF',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                You ({user?.role}) {isMicMuted && '• 🔇 Muted'}
              </div>
            </div>

            {/* Media Controls Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                paddingTop: '0.25rem',
              }}
            >
              <button
                onClick={toggleMic}
                className={`btn btn-sm ${isMicMuted ? 'btn-danger' : 'btn-secondary'}`}
                style={{
                  borderRadius: '50%',
                  width: 42,
                  height: 42,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`btn btn-sm ${isCameraOff ? 'btn-danger' : 'btn-secondary'}`}
                style={{
                  borderRadius: '50%',
                  width: 42,
                  height: 42,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            </div>
          </div>

          {/* Session Info Card */}
          <div
            className="card"
            style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <Users size={16} color="var(--accent-gold)" /> Room Participants ({participants.length})
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
              {participants.map((p) => (
                <li
                  key={p.socketId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontWeight: p.id === user.id ? 700 : 500 }}>
                    {p.name} {p.id === user.id && '(You)'}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {p.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
