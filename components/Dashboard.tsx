"use client"
import { useState, useEffect } from "react";
import { FaCheckCircle, FaCalendarAlt } from "react-icons/fa";

interface ConversationItem {
    timestamp: string;
    dateJST: string;
    title: string;
    category: string;
    categoryTitle: string;
    details: string;
    actionRequired: boolean;
    archived?: boolean;
}

interface Goal {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    quarter: string;
}

export default function Dashboard() {
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [archivedItems, setArchivedItems] = useState<ConversationItem[]>([]);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        // Load data (actually fetched from API)
        fetch('/data/conversations.json')
            .then(res => res.json())
            .then(data => setConversations(data.filter((item: ConversationItem) => !item.archived)));

        fetch('/data/goals.json')
            .then(res => res.json())
            .then(data => setGoals(data));
    }, []);

    const handleArchive = (index: number) => {
        const item = conversations[index];
        setArchivedItems([...archivedItems, { ...item, archived: true }]);
        setConversations(conversations.filter((_, i) => i !== index));
    };

    const blockers = conversations.filter(c => c.category === "Today's Challenges");
    const asks = conversations.filter(c => c.category === "Things to Discuss");
    const achievements = conversations.filter(c => c.category === "Today's Wins");

    const askCount = asks.length;
    const askStatus = askCount >= 3 ? 'bg-yellow-100 border-yellow-400' : 'bg-white';

    const handleSchedule1on1 = () => {
        // Open Google Calendar
        const title = encodeURIComponent("1on1 Meeting");
        const details = encodeURIComponent("Consultation items review");
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            {showArchived ? 'Current View' : 'Archive'}
                        </button>
                        <button
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                        >
                            Quarterly Analysis
                        </button>
                    </div>
                </div>

                {!showArchived ? (
                    <>
                        {/* Goal Achievement */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Goal Achievement (Current Quarter: OKR)</h2>
                            <div className="space-y-4">
                                {goals.map((goal) => {
                                    const percentage = Math.round((goal.current / goal.target) * 100);
                                    return (
                                        <div key={goal.id} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">
                                                    {goal.title} ({goal.current}{goal.unit})
                                                </span>
                                                <span className="text-blue-600 font-semibold">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Daily Challenges (Blocker) */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 text-gray-800">Daily Challenges (Blocker)</h2>
                                <div className="space-y-3">
                                    {blockers.map((blocker, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                            <input
                                                type="checkbox"
                                                onChange={() => handleArchive(conversations.indexOf(blocker))}
                                                className="mt-1 w-5 h-5 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">{blocker.categoryTitle}</div>
                                                <div className="text-sm text-gray-600 mt-1">{blocker.details}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Things to Discuss (Ask) */}
                            <div className={`rounded-xl shadow-lg p-6 border-2 ${askStatus}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">Things to Discuss (Ask)</h2>
                                    {askCount >= 3 && (
                                        <button
                                            onClick={handleSchedule1on1}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                        >
                                            <FaCalendarAlt />
                                            Schedule 1on1
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {asks.map((ask, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <input
                                                type="checkbox"
                                                onChange={() => handleArchive(conversations.indexOf(ask))}
                                                className="mt-1 w-5 h-5 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">{ask.categoryTitle}</div>
                                                <div className="text-sm text-gray-600 mt-1">{ask.details}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Today's Wins */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Today's Wins</h2>
                            <div className="space-y-3">
                                {achievements.map((achievement, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleArchive(conversations.indexOf(achievement))}
                                            className="mt-1 w-5 h-5 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800">{achievement.categoryTitle}</div>
                                            <div className="text-sm text-gray-600 mt-1">{achievement.details}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mood Sparkline */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Mood Sparkline (7-day Moving Average)</h2>
                            <div className="h-32 flex items-end justify-between gap-2">
                                {[65, 70, 68, 75, 80, 78, 85].map((value, index) => (
                                    <div
                                        key={index}
                                        className="flex-1 bg-gradient-to-t from-blue-400 to-blue-300 rounded-t"
                                        style={{ height: `${value}%` }}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>7 days ago</span>
                                <span>Today</span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Archive View */
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Archived Items</h2>
                        <div className="space-y-3">
                            {archivedItems.map((item, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <FaCheckCircle className="text-green-500 mt-1" />
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800">{item.categoryTitle}</div>
                                            <div className="text-sm text-gray-600 mt-1">{item.details}</div>
                                            <div className="text-xs text-gray-400 mt-1">{item.dateJST}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {archivedItems.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No archived items</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
