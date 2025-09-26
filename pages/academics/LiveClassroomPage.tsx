import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import * as liveClassService from '../../lib/liveClassService';
import type { LiveClass, LiveClassParticipant } from '../../types';

const VideoTile: React.FC<{ stream?: MediaStream; name: string; isMuted?: boolean; isHost?: boolean }> = ({ stream, name, isMuted, isHost }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!stream && <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Video</div>}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {isHost && '👑 '}
                {name}
            </div>
            {isMuted && (
                 <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5h-1a7.5 7.5 0 01-7.5-7.5V7.625a7.5 7.5 0 017.5-7.5h1a7.5 7.5 0 017.5 7.5v3.375z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11.25l-2.25 2.25m0-2.25L17 11.25z" /></svg>
                 </div>
            )}
        </div>
    );
};

const LiveClassroomPage: React.FC = () => {
    const { siteId, liveClassId } = useParams<{ siteId: string; liveClassId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isTeacher = user?.scopes.includes('homework:teacher');
    const studentId = user?.scopes.includes('homework:student') ? 's01' : null; // HACK

    const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
    const [participants, setParticipants] = useState<LiveClassParticipant[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    
    useEffect(() => {
        if (!liveClassId) { navigate(`/school/${siteId}`); return; }
        
        // Fetch class details and participants
        liveClassService.getLiveClassDetails(liveClassId).then(setLiveClass);
        liveClassService.getLiveClassParticipants(liveClassId).then(setParticipants);

        // Mark student attendance
        if (studentId) {
            liveClassService.joinLiveClass(liveClassId, studentId);
        }

        // Get user media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => setLocalStream(stream))
            .catch(err => {
                console.error("Error accessing media devices.", err);
                setPermissionError(true);
            });
            
        return () => { // Cleanup on unmount
            localStream?.getTracks().forEach(track => track.stop());
        };
    }, [liveClassId, navigate, siteId, studentId]);

    const toggleMic = () => {
        localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setIsMicMuted(!isMicMuted);
    };

    const toggleCamera = () => {
        localStream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setIsCameraOff(!isCameraOff);
    };

    const handleLeave = () => {
        localStream?.getTracks().forEach(track => track.stop());
        const returnPath = isTeacher ? `/school/${siteId}/academics/live-classes` : `/school/${siteId}/student/live-classes`;
        navigate(returnPath);
    };

    const mainSpeaker = isTeacher ? { id: user.id, name: user.name, isHost: true } : participants.find(p => p.isHost);
    const otherParticipants = participants.filter(p => p.id !== mainSpeaker?.id);

    if (permissionError) {
        return <div className="text-center p-8 bg-red-100 text-red-800">Camera and Microphone access denied. Please enable permissions in your browser settings to join the class.</div>
    }
    
    return (
        <div className="fixed inset-0 bg-gray-800 text-white flex flex-col">
            <header className="p-4 flex justify-between items-center bg-gray-900">
                <h1 className="text-xl font-bold">{liveClass?.topic || 'Live Class'}</h1>
                <div className="text-sm">Participants: {participants.length + 1}</div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col p-4 gap-4">
                    {/* Main Speaker View */}
                    <div className="flex-1 min-h-0">
                        <VideoTile stream={localStream} name={mainSpeaker?.name || 'Host'} isHost />
                    </div>
                     {/* Self View */}
                     <div className="w-48 flex-shrink-0">
                        <VideoTile stream={localStream} name={`${user?.name} (You)`} isMuted={isMicMuted} />
                    </div>
                </div>
                {/* Participants Grid */}
                <div className="w-64 bg-gray-900 p-2 overflow-y-auto space-y-2">
                    {otherParticipants.map(p => (
                        <VideoTile key={p.id} name={p.name} />
                    ))}
                </div>
            </main>

            <footer className="p-4 bg-gray-900 flex justify-center items-center gap-4">
                 <button onClick={toggleMic} className={`p-3 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-600'}`}>
                    {isMicMuted ? 'Unmute' : 'Mute'}
                </button>
                 <button onClick={toggleCamera} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-600'}`}>
                    {isCameraOff ? 'Start Cam' : 'Stop Cam'}
                </button>
                 <button onClick={handleLeave} className="px-6 py-3 bg-red-600 rounded-lg font-bold">
                    {isTeacher ? 'End Class' : 'Leave'}
                </button>
            </footer>
        </div>
    );
};

export default LiveClassroomPage;