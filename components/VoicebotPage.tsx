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
    const [isCheckIn, setIsCheckIn] = useState(true); // 出勤/退勤トグル
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isAvatarActive, setIsAvatarActive] = useState(false);

    const calendarEvents: CalendarEvent[] = [
        { time: "9:30", title: "クライアントMTG（株式会社アクティブ）" },
        { time: "11:00", title: "社内進捗共有" },
        { time: "13:00", title: "新規提案会議（株式会社ネクスト）" },
        { time: "16:00", title: "社内1on1" },
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
        // 通話終了後の処理は不要
    };

    const { isPlaying, stop, start, interrupt, isConnected, sendTextMessage, getRecording, micPermissionError, toggleMute, togglePlaybackMute } = useAudioPlayer(onClose, onResponse, "1570fba4-f261-4557-a2c6-8f6efed82533");

    const handleCheckInOut = () => {
        if (isCheckIn) {
            setShowCalendar(true);
            // ボイスボットを起動してミュート状態にする
            start();
            toggleMute();
            togglePlaybackMute();
        } else {
            setShowCalendar(false);
            if (isConnected) {
                stop();
            }
        }
    };

    const handleAvatarClick = () => {
        if (!isAvatarActive) {
            // グレーアウト解除 - ミュート解除
            setIsAvatarActive(true);
            if (isConnected) {
                toggleMute();
                togglePlaybackMute();
            }
        } else {
            // グレーアウト - 通話終了
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
                    <h3 className="text-lg font-semibold mb-2">マイクの使用許可が必要です</h3>
                    <p className="mb-4">ブラウザの設定からマイクの使用を許可してください。</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        再読み込み
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col h-screen p-8">
            {/* トグルスイッチ */}
            <div className="flex justify-center mb-4">
                <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm">
                    <button
                        onClick={() => setIsCheckIn(true)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isCheckIn ? 'bg-blue-500 text-white' : 'text-gray-600'
                            }`}
                    >
                        出勤
                    </button>
                    <button
                        onClick={() => setIsCheckIn(false)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isCheckIn ? 'bg-red-500 text-white' : 'text-gray-600'
                            }`}
                    >
                        退勤
                    </button>
                </div>
            </div>

            {/* 日付・時間表示 */}
            <div className="flex flex-col items-center mb-8">
                <div className="text-6xl font-bold text-gray-800 mb-2">
                    {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-2xl text-gray-600">
                    {currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
            </div>

            {/* 出退勤ボタン */}
            {!showCalendar && (
                <div className="flex justify-center mb-8">
                    <button
                        onClick={handleCheckInOut}
                        className={`px-16 py-8 rounded-2xl text-3xl font-bold shadow-2xl transition-all duration-300 ${isCheckIn
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                            }`}
                    >
                        {isCheckIn ? '出勤' : '退勤'}
                    </button>
                </div>
            )}

            {/* カレンダーとアバター */}
            {showCalendar && (
                <div className="flex gap-8 justify-center items-start">
                    {/* カレンダー */}
                    <div className="bg-white rounded-xl shadow-lg p-6 w-96">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">今日の予定</h3>
                        <div className="space-y-3">
                            {calendarEvents.map((event, index) => (
                                <div key={index} className="flex items-start border-l-4 border-blue-500 pl-3 py-2">
                                    <div className="font-semibold text-blue-600 w-16">{event.time}</div>
                                    <div className="text-gray-700">{event.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* アバター */}
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
                            {isAvatarActive ? '通話中' : 'タップして話す'}
                        </div>

                        {/* テキスト入力フォーム */}
                        {isAvatarActive && (
                            <div className="mt-4 w-80">
                                <Input
                                    type="text"
                                    value={textMessage}
                                    onChange={(e) => setTextMessage(e.target.value)}
                                    onKeyPress={handleTextSubmit}
                                    placeholder="テキストで入力"
                                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* メッセージ履歴 */}
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
