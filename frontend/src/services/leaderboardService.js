export const fetchLeaderboard = async () => {
  const response = await fetch('/api/leaderboard');
  return response.json();
};
