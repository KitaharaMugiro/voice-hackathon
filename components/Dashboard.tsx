"use client"
import { useState, useEffect } from "react";
import { FaCheckCircle, FaCalendarAlt } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';

interface ConversationItem {
    timestamp: string;
    dateJST: string;
    title: string;
    category: string;
    categoryTitle: string;
    details: string;
    actionRequired: boolean;
    archived?: boolean;
    checked?: boolean;
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
    const [showQuarterlyAnalysis, setShowQuarterlyAnalysis] = useState(false);
    const [editingGoal, setEditingGoal] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [allConversations, setAllConversations] = useState<ConversationItem[]>([]);

    useEffect(() => {
        // Load data (actually fetched from API)
        fetch('/conversations.json')
            .then(res => res.json())
            .then(data => {
                // Store all conversations for quarterly analysis
                setAllConversations(data);
                // Filter out items that are already checked from the initial load
                const filtered = data.filter((item: ConversationItem) => !item.archived && !item.checked);
                setConversations(filtered);
                // Store archived items separately
                const archived = data.filter((item: ConversationItem) => item.archived);
                setArchivedItems(archived);
            })
            .catch(err => console.error('Failed to load conversations:', err));

        fetch('/goals.json')
            .then(res => res.json())
            .then(data => setGoals(data))
            .catch(err => console.error('Failed to load goals:', err));
    }, []);

    const handleToggleCheck = (item: ConversationItem) => {
        const updatedItem = { ...item, checked: !item.checked };

        if (updatedItem.checked) {
            // チェックされた場合、archivedに設定してアーカイブに移動
            updatedItem.archived = true;
            setConversations(conversations.filter(c =>
                !(c.timestamp === item.timestamp && c.categoryTitle === item.categoryTitle)
            ));
            setArchivedItems([...archivedItems, updatedItem]);
        } else {
            setConversations(conversations.map(c =>
                c.timestamp === item.timestamp && c.categoryTitle === item.categoryTitle
                    ? updatedItem
                    : c
            ));
        }
    };

    const blockers = conversations.filter(c => c.category === "Today's Challenges" && c.categoryTitle && c.details);
    const asks = conversations.filter(c => c.category === "Things to Discuss" && c.categoryTitle && c.details);
    const achievements = conversations.filter(c => c.category === "Today's Wins" && c.categoryTitle && c.details);

    const askCount = asks.length;
    const askStatus = askCount >= 3 ? 'bg-yellow-100 border-yellow-400' : 'bg-white';

    const handleSchedule1on1 = () => {
        // Open Google Calendar
        const title = encodeURIComponent("1on1 Meeting");
        const details = encodeURIComponent("Consultation items review");
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, '_blank');
    };

    const handleUpdateGoal = (goalId: string, field: 'current' | 'target', value: number) => {
        setGoals(goals.map(g =>
            g.id === goalId ? { ...g, [field]: value } : g
        ));
    };

    const handleAnalyzeQuarter = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/analyze_quarter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversations: allConversations,
                    goals: goals
                })
            });
            const data = await response.json();
            setAnalysis(data.analysis || 'Analysis failed');
        } catch (error) {
            console.error('Failed to analyze:', error);
            setAnalysis('分析に失敗しました。もう一度お試しください。');
        } finally {
            setIsAnalyzing(false);
        }
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
                            onClick={() => setShowQuarterlyAnalysis(true)}
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
                                    const isEditing = editingGoal === goal.id;
                                    return (
                                        <div key={goal.id} className="space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-gray-700 font-medium">{goal.title}</span>
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={goal.current}
                                                                onChange={(e) => handleUpdateGoal(goal.id, 'current', parseInt(e.target.value) || 0)}
                                                                className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <span className="text-gray-500">/</span>
                                                            <input
                                                                type="number"
                                                                value={goal.target}
                                                                onChange={(e) => handleUpdateGoal(goal.id, 'target', parseInt(e.target.value) || 0)}
                                                                className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <span className="text-gray-600">{goal.unit}</span>
                                                            <button
                                                                onClick={() => setEditingGoal(null)}
                                                                className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                                            >
                                                                Done
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-600">
                                                                ({goal.current}{goal.unit})
                                                            </span>
                                                            <button
                                                                onClick={() => setEditingGoal(goal.id)}
                                                                className="text-gray-400 hover:text-blue-500"
                                                            >
                                                                ✎
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-blue-600 font-semibold text-lg">{percentage}%</span>
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
                                        <div key={index} className={`flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200 transition-opacity ${blocker.checked ? 'opacity-40' : 'opacity-100'}`}>
                                            <input
                                                type="checkbox"
                                                checked={blocker.checked || false}
                                                onChange={() => handleToggleCheck(blocker)}
                                                className="mt-1 w-5 h-5 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className={`font-semibold text-gray-800 ${blocker.checked ? 'line-through' : ''}`}>{blocker.categoryTitle}</div>
                                                <div className={`text-sm text-gray-600 mt-1 ${blocker.checked ? 'line-through' : ''}`}>{blocker.details}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Things to Discuss (Ask) */}
                            <div className={`rounded-xl shadow-lg p-6 border-2 ${askStatus}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">Things to Discuss (Ask)</h2>
                                    {askCount >= 1 && (
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
                                        <div key={index} className={`flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200 transition-opacity ${ask.checked ? 'opacity-40' : 'opacity-100'}`}>
                                            <input
                                                type="checkbox"
                                                checked={ask.checked || false}
                                                onChange={() => handleToggleCheck(ask)}
                                                className="mt-1 w-5 h-5 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className={`font-semibold text-gray-800 ${ask.checked ? 'line-through' : ''}`}>{ask.categoryTitle}</div>
                                                <div className={`text-sm text-gray-600 mt-1 ${ask.checked ? 'line-through' : ''}`}>{ask.details}</div>
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
                                    <div key={index} className={`flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200 transition-opacity ${achievement.checked ? 'opacity-40' : 'opacity-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={achievement.checked || false}
                                            onChange={() => handleToggleCheck(achievement)}
                                            className="mt-1 w-5 h-5 text-blue-600"
                                        />
                                        <div className="flex-1">
                                            <div className={`font-semibold text-gray-800 ${achievement.checked ? 'line-through' : ''}`}>{achievement.categoryTitle}</div>
                                            <div className={`text-sm text-gray-600 mt-1 ${achievement.checked ? 'line-through' : ''}`}>{achievement.details}</div>
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

                {/* Quarterly Analysis Modal */}
                {showQuarterlyAnalysis && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
                        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-gray-800">Quarterly Analysis - Q4 2025</h2>
                                <button
                                    onClick={() => setShowQuarterlyAnalysis(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* AI Analysis Section */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-2xl font-bold text-gray-800">AI Analysis</h3>
                                        <button
                                            onClick={handleAnalyzeQuarter}
                                            disabled={isAnalyzing}
                                            className={`px-6 py-2 rounded-lg font-semibold ${
                                                isAnalyzing
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-purple-500 text-white hover:bg-purple-600'
                                            }`}
                                        >
                                            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                                        </button>
                                    </div>
                                    {isAnalyzing ? (
                                        <div className="bg-white rounded-lg p-6">
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                            </div>
                                            <div className="text-center text-gray-700 space-y-2">
                                                <p className="font-semibold">Analyzing all historical data...</p>
                                                <p className="text-sm text-gray-500">
                                                    Reviewing {allConversations.filter(c => c.categoryTitle).length} conversation logs across all categories
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    • {allConversations.filter(c => c.category === "Today's Wins" && c.categoryTitle).length} wins
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    • {allConversations.filter(c => c.category === "Today's Challenges" && c.categoryTitle).length} challenges
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    • {allConversations.filter(c => c.category === "Things to Discuss" && c.categoryTitle).length} discussion items
                                                </p>
                                            </div>
                                        </div>
                                    ) : analysis ? (
                                        <div className="bg-white rounded-lg p-6 prose prose-slate max-w-none">
                                            <ReactMarkdown>{analysis}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-lg p-6 text-gray-500 text-center">
                                            Click "Start Analysis" to get AI-powered quarterly insights based on all your conversation history.
                                        </div>
                                    )}
                                </div>

                                {/* Goal Progress Summary */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Goal Achievement Summary</h3>
                                    <div className="space-y-4">
                                        {goals.map((goal) => {
                                            const percentage = Math.round((goal.current / goal.target) * 100);
                                            return (
                                                <div key={goal.id} className="bg-white rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-gray-700 font-semibold">
                                                            {goal.title}
                                                        </span>
                                                        <span className="text-blue-600 font-bold text-lg">{percentage}%</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        Progress: {goal.current} / {goal.target} {goal.unit}
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

                                {/* All Conversations History */}
                                <div className="bg-white rounded-xl border p-6">
                                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Complete Conversation History</h3>

                                    {/* Wins */}
                                    <div className="mb-6">
                                        <h4 className="text-xl font-semibold text-green-700 mb-3">Wins ({conversations.filter(c => c.category === "Today's Wins" && c.categoryTitle).length})</h4>
                                        <div className="space-y-2">
                                            {conversations.filter(c => c.category === "Today's Wins" && c.categoryTitle).map((item, index) => (
                                                <div key={index} className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                                    <div className="font-semibold text-gray-800">{item.categoryTitle}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{item.details}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{item.dateJST}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Challenges */}
                                    <div className="mb-6">
                                        <h4 className="text-xl font-semibold text-red-700 mb-3">Challenges ({conversations.filter(c => c.category === "Today's Challenges" && c.categoryTitle).length})</h4>
                                        <div className="space-y-2">
                                            {conversations.filter(c => c.category === "Today's Challenges" && c.categoryTitle).map((item, index) => (
                                                <div key={index} className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                                    <div className="font-semibold text-gray-800">{item.categoryTitle}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{item.details}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{item.dateJST}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Discussions */}
                                    <div>
                                        <h4 className="text-xl font-semibold text-yellow-700 mb-3">Things Discussed ({conversations.filter(c => c.category === "Things to Discuss" && c.categoryTitle).length})</h4>
                                        <div className="space-y-2">
                                            {conversations.filter(c => c.category === "Things to Discuss" && c.categoryTitle).map((item, index) => (
                                                <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                                    <div className="font-semibold text-gray-800">{item.categoryTitle}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{item.details}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{item.dateJST}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Self-Evaluation Section */}
                                <div className="bg-purple-50 rounded-xl p-6">
                                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Self-Evaluation</h3>
                                    <textarea
                                        className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Write your quarterly self-evaluation here. Reflect on your achievements, challenges, and areas for improvement..."
                                    ></textarea>
                                    <button className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                                        Save Evaluation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
