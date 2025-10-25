"use client"
import useAudioPlayer from "@/components/Voicebot/useAudioPlayer";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Message {
    type: 'user' | 'ai';
    content: string;
}

interface CalendarEvent {
    time: string;
    title: string;
}

export default function VoicebotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [textMessage, setTextMessage] = useState('');
    const [isCheckIn, setIsCheckIn] = useState(true); // Check-in/Check-out toggle
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAvatarActive, setIsAvatarActive] = useState(false);

    const calendarEvents: CalendarEvent[] = [
        { time: "9:30", title: "Client Meeting (Active Co.)" },
        { time: "11:00", title: "Internal Progress Sharing" },
        { time: "13:00", title: "New Proposal Meeting (Next Co.)" },
        { time: "16:00", title: "Internal 1on1" },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const onResponse = (type: string, content: any) => {
        if (type === 'user' || type === 'ai') {
            const contentText = content.text;
            setMessages(prevMessages => [
                ...prevMessages,
                { type: type as 'user' | 'ai', content: contentText }
            ]);
        } else if (type === "pause") {
            interrupt()
        }
    };

    const onClose = () => {
        // No post-call processing needed
    };

    const agentId = isCheckIn
        ? process.env.NEXT_PUBLIC_SHUKKIN
        : process.env.NEXT_PUBLIC_TAIKIN;

    const { isPlaying, stop, start, interrupt, isConnected, sendTextMessage, getRecording, micPermissionError, toggleMute, togglePlaybackMute } = useAudioPlayer(onClose, onResponse, agentId || "");

    const handleCheckInOut = () => {
        setShowCalendar(true);
        // Start voicebot in muted state
        start();
        toggleMute();
        togglePlaybackMute();
    };

    const handleAvatarClick = () => {
        if (!isAvatarActive) {
            // Remove grayscale - unmute
            setIsAvatarActive(true);
            if (isConnected) {
                toggleMute();
                togglePlaybackMute();
            }
        } else {
            // Apply grayscale - end call
            setIsAvatarActive(false);
            if (isConnected) {
                stop();
            }
        }
    };

    const handleTextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && textMessage.trim() !== '') {
            sendTextMessage(textMessage);
            setMessages(prevMessages => [
                ...prevMessages,
                { type: 'user', content: textMessage }
            ]);
            setTextMessage('');
        }
    };

    return <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto">
        {micPermissionError && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl">
                    <h3 className="text-lg font-semibold mb-2">Microphone Permission Required</h3>
                    <p className="mb-4">Please allow microphone access in your browser settings.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Reload
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col h-screen p-8">
            {/* Dashboard Link */}
            <div className="absolute top-4 right-4">
                <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-800 underline">
                    Dashboard
                </a>
            </div>
            {/* Toggle Switch */}
            <div className="flex justify-center mb-4">
                <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm">
                    <button
                        onClick={() => setIsCheckIn(true)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isCheckIn ? 'bg-blue-500 text-white' : 'text-gray-600'
                            }`}
                    >
                        Check In
                    </button>
                    <button
                        onClick={() => setIsCheckIn(false)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isCheckIn ? 'bg-red-500 text-white' : 'text-gray-600'
                            }`}
                    >
                        Check Out
                    </button>
                </div>
            </div>

            {/* Date and Time Display */}
            <div className="flex flex-col items-center mb-8">
                <div className="text-6xl font-bold text-gray-800 mb-2">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-2xl text-gray-600">
                    {currentTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
            </div>

            {/* Check In/Out Button */}
            {!showCalendar && (
                <div className="flex justify-center mb-8">
                    <button
                        onClick={handleCheckInOut}
                        className={`px-16 py-8 rounded-2xl text-3xl font-bold shadow-2xl transition-all duration-300 ${isCheckIn
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                            }`}
                    >
                        {isCheckIn ? 'Check In' : 'Check Out'}
                    </button>
                </div>
            )}

            {/* Calendar and Avatar */}
            {showCalendar && (
                <div className="flex gap-8 justify-center items-start">
                    {/* Calendar */}
                    <div className="bg-white rounded-xl shadow-lg p-6 w-96">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Today's Schedule</h3>
                        <div className="space-y-3">
                            {calendarEvents.map((event, index) => (
                                <div key={index} className="flex items-start border-l-4 border-blue-500 pl-3 py-2">
                                    <div className="font-semibold text-blue-600 w-16">{event.time}</div>
                                    <div className="text-gray-700">{event.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleAvatarClick}
                            className={`w-64 h-64 rounded-full overflow-hidden shadow-2xl transition-all duration-300 ${!isAvatarActive ? 'grayscale opacity-50' : 'grayscale-0 opacity-100'
                                }`}
                        >
                            <img
                                src="/avatar.png"
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </button>
                        <div className="text-center mt-4 text-gray-700">
                            {isAvatarActive ? 'On Call' : 'Tap to Talk'}
                        </div>

                        {/* Text Input Form */}
                        {isAvatarActive && (
                            <div className="mt-4 w-80">
                                <Input
                                    type="text"
                                    value={textMessage}
                                    onChange={(e) => setTextMessage(e.target.value)}
                                    onKeyPress={handleTextSubmit}
                                    placeholder="Type message"
                                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Message History */}
            {showCalendar && (
                <div className="flex-grow overflow-y-auto px-4 mt-8 max-w-4xl mx-auto w-full">
                    {messages.slice(-5).map((message, index) => (
                        <div key={index} className={`mb-3 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block p-3 rounded-2xl ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                                {message.content}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
}
