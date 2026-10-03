import api from './api';

// ---------------------------------------------------------------------------
// Expected .NET Core Web API contract for groups (adjust paths to match your
// controller). The authenticated user is identified server-side from the
// Bearer token on every call below — the client never sends its own name.
//
//   GET  /api/groups
//        -> 200 [{ id, name, memberCount, maxMembers, status }]
//           `status` is "waiting" (fewer than 2 active players) or "playing".
//           This powers the Dashboard list.
//
//   GET  /api/groups/{groupId}
//        -> 200 full group state (see shape below) — used for polling.
//
//   POST /api/groups/{groupId}/join
//        -> 200 full group state. Server adds the caller to the back of the
//           waiting queue, or straight into activePlayers if there are fewer
//           than 2 active players. Returns 409 if the group already has 5
//           members or the user is already in it.
//
//   POST /api/groups/{groupId}/roll
//        -> 200 full group state, with the roll applied server-side (dice
//           values, win/loss/neutral resolution, queue rotation).
//           Returns 403 if the caller isn't the group's currentTurn.
//
//   POST /api/groups/{groupId}/leave
//        -> 200 (no body needed). Removes the caller from the group
//           (from the queue, or from activePlayers with the next challenger
//           promoted in, mirroring a loss).
//
// Full group state shape (mirrors the local gameSlice shape 1:1 so the UI
// code barely changes):
//   {
//     id, name, maxMembers,
//     activePlayers: [name, name],
//     waitingQueue: [name, ...],
//     currentTurn: name,
//     diceValues: [n, n] | [null, null],
//     gameHistory: [string, ...],
//     status: 'waiting' | 'playing' | 'finished',
//     winner: name | null,
//   }
// ---------------------------------------------------------------------------

const groupService = {
  listGroups: async () => {
    const { data } = await api.get('/groups');
    return data;
  },

  getGroupState: async (groupId) => {
    const { data } = await api.get(`/groups/${groupId}`);
    return data;
  },

  joinGroup: async (groupId) => {
    const { data } = await api.post(`/groups/${groupId}/join`);
    return data;
  },

  rollDice: async (groupId) => {
    const { data } = await api.post(`/groups/${groupId}/roll`);
    return data;
  },

  leaveGroup: async (groupId) => {
    await api.post(`/groups/${groupId}/leave`);
  },
};

export default groupService;
