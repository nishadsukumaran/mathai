/**
 * @module apps/web/app/leaderboard/page
 *
 * Leaderboard page — server component showing top students.
 * Uses gamification data from the API.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

async function fetchGamification(_userId: string) {
  return apiFetch("/gamification/dashboard");
}

// Mock leaderboard data until the API grows a real endpoint
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Alice",   xp: 850,  level: 4,  streak: 7,  avatar: "🚀" },
  { rank: 2, name: "Marcus",  xp: 720,  level: 3,  streak: 5,  avatar: "⭐" },
  { rank: 3, name: "Priya",   xp: 680,  level: 3,  streak: 12, avatar: "🌟" },
  { rank: 4, name: "Leo",     xp: 540,  level: 2,  streak: 3,  avatar: "🎯" },
  { rank: 5, name: "Zoe",     xp: 490,  level: 2,  streak: 1,  avatar: "🏆" },
];

const RANK_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? "user-alice-001";
  const gamification = await fetchGamification(userId);

  const currentUserXp    = gamification?.xp ?? 0;
  const currentUserLevel = gamification?.level ?? 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-800">Leaderboard 🏆</h1>
          <p className="text-sm text-gray-400 mt-1">Top mathematicians this week</p>
        </div>

        {/* Your position */}
        {gamification && (
          <div className="bg-indigo-600 text-white rounded-2xl p-5 flex items-center gap-4">
            <div className="text-3xl">👤</div>
            <div className="flex-1">
              <p className="font-bold">You — Level {currentUserLevel}</p>
              <p className="text-indigo-200 text-sm">{currentUserXp} XP · Streak {gamification.streak} days</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-300">Keep going! 🔥</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          {MOCK_LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${
                entry.rank === 1 ? "border-yellow-200 bg-yellow-50" : "border-gray-100"
              }`}
            >
              <div className="text-2xl w-8 text-center">
                {RANK_MEDALS[entry.rank] ?? `${entry.rank}`}
              </div>
              <div className="text-2xl">{entry.avatar}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{entry.name}</p>
                <p className="text-xs text-gray-400">
                  Level {entry.level} · 🔥 {entry.streak} day streak
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-indigo-600">{entry.xp}</p>
                <p className="text-xs text-gray-400">XP</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center text-sm text-blue-600">
          🔮 Real-time leaderboard coming soon — as more students join, rankings update live!
        </div>

      </div>
    </div>
  );
}
