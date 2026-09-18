const state = {
  matches: [],
  commentary: {},
  featuredId: null,
};

const matchListEl = document.getElementById('matchList');
const featuredMatchEl = document.getElementById('featuredMatch');
const leaderboardEl = document.getElementById('leaderboard');
const commentaryFeedEl = document.getElementById('commentaryFeed');

function formatStatus(status) {
  if (status === 'live') return 'Live';
  if (status === 'finished') return 'Final';
  return 'Scheduled';
}

function renderFeatured(match) {
  if (!match) return;

  const scoreText = `${match.homeScore} : ${match.awayScore}`;

  featuredMatchEl.innerHTML = `
    <div class="team-block">
      <div class="team-badge">${match.homeTeam.slice(0, 2).toUpperCase()}</div>
      <div class="team-name">${match.homeTeam}</div>
      <div class="team-tag">Home</div>
    </div>

    <div class="score-wrap">
      <div class="score-value">
        <strong>${match.homeScore}</strong>
        <span class="score-separator">:</span>
        <strong>${match.awayScore}</strong>
      </div>
      <div class="score-meta">${match.sport} • ${formatStatus(match.status)}</div>
      <div class="chip accent">${match.status === 'live' ? 'In play' : 'Match center'}</div>
    </div>

    <div class="team-block">
      <div class="team-badge">${match.awayTeam.slice(0, 2).toUpperCase()}</div>
      <div class="team-name">${match.awayTeam}</div>
      <div class="team-tag">Away</div>
    </div>
  `;
}

function renderLeaderboard() {
  const top = [...state.matches]
    .sort((a, b) => b.homeScore + b.awayScore - (a.homeScore + a.awayScore))
    .slice(0, 4);

  leaderboardEl.innerHTML = top
    .map((match, index) => {
      const total = match.homeScore + match.awayScore;
      const first = match.homeTeam.slice(0, 1).toUpperCase();
      const second = match.awayTeam.slice(0, 1).toUpperCase();
      return `
        <li>
          <div class="team-mini">
            <span class="rank">${index + 1}</span>
            <div class="mini-mark">${first}${second}</div>
            <div>
              <strong>${match.homeTeam}</strong>
              <span>${match.sport}</span>
            </div>
          </div>
          <span class="stat-badge">${total}</span>
        </li>
      `;
    })
    .join('');
}

function renderMatchList() {
  matchListEl.innerHTML = state.matches
    .map((match) => {
      const isLive = match.status === 'live';
      return `
        <article class="match-card ${isLive ? 'live' : ''}" data-id="${match.id}">
          <div class="team-side">
            <div class="short">${match.homeTeam.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>${match.homeTeam}</strong>
              <div class="team-tag">Home</div>
            </div>
          </div>

          <div class="vs-score">
            <span>${match.homeScore}</span>
            <small>:</small>
            <span>${match.awayScore}</span>
          </div>

          <div class="match-status">
            <span class="badge ${match.status}">${formatStatus(match.status)}</span>
            <small>${match.awayTeam}</small>
          </div>
        </article>
      `;
    })
    .join('');

  matchListEl.querySelectorAll('.match-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      state.featuredId = id;
      const activeMatch = state.matches.find((match) => match.id === id);
      renderFeatured(activeMatch);
      renderCommentary(id);
    });
  });
}

function renderCommentary(matchId) {
  const entries = state.commentary[matchId] || [];

  commentaryFeedEl.innerHTML = entries
    .slice(0, 6)
    .map((item) => `
      <article class="commentary-item">
        <div class="commentary-time">${item.minute}'</div>
        <div class="commentary-body">
          <div class="commentary-header">
            <strong>${item.actor}</strong>
            <span>${item.eventType}</span>
          </div>
          <p>${item.message}</p>
        </div>
      </article>
    `)
    .join('');
}

async function loadInitialData() {
  const res = await fetch('/api/matches');
  const payload = await res.json();
  state.matches = payload.data;
  state.featuredId = state.matches[0]?.id || null;

  state.matches.forEach(async (match) => {
    const commentaryRes = await fetch(`/api/matches/${match.id}/commentary`);
    const commentaryPayload = await commentaryRes.json();
    state.commentary[match.id] = commentaryPayload.data || [];
  });

  renderFeatured(state.matches.find((match) => match.id === state.featuredId));
  renderLeaderboard();
  renderMatchList();
  renderCommentary(state.featuredId);
}

function simulateLiveUpdate() {
  if (!state.matches.length) return;

  const liveMatch = state.matches.find((match) => match.status === 'live') || state.matches[0];

  if (!liveMatch) return;

  const homeBoost = Math.random() > 0.55 ? 1 : 0;
  const awayBoost = Math.random() > 0.6 ? 1 : 0;

  liveMatch.homeScore += homeBoost;
  liveMatch.awayScore += awayBoost;

  const actorNames = ['R. Shah', 'J. Patel', 'A. Khan', 'M. Noor', 'D. Lee'];
  const teamNames = [liveMatch.homeTeam, liveMatch.awayTeam];
  const events = ['Boundary', 'Wicket', 'Six', 'Shot on target', 'Free kick'];

  const entry = {
    id: Date.now(),
    matchId: liveMatch.id,
    minute: Math.floor(Math.random() * 90) + 1,
    actor: actorNames[Math.floor(Math.random() * actorNames.length)],
    period: 'Live',
    eventType: events[Math.floor(Math.random() * events.length)],
    message: `${actorNames[Math.floor(Math.random() * actorNames.length)]} changes the tempo with a ${events[Math.floor(Math.random() * events.length)].toLowerCase()} for ${teamNames[Math.floor(Math.random() * teamNames.length)]}.`,
    team: teamNames[Math.floor(Math.random() * teamNames.length)],
    sequenceNo: Date.now(),
    tags: ['live'],
    createdAt: new Date().toISOString(),
  };

  if (!state.commentary[liveMatch.id]) state.commentary[liveMatch.id] = [];
  state.commentary[liveMatch.id].unshift(entry);

  renderFeatured(liveMatch);
  renderLeaderboard();
  renderMatchList();
  renderCommentary(liveMatch.id);
}

loadInitialData();
setInterval(simulateLiveUpdate, 4200);
