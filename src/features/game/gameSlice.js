import { createSlice } from '@reduxjs/toolkit';

// ---------------------------------------------------------------------------
// Dice combination tables.
// Order doesn't matter for a roll (e.g. rolling a 5 then a 6 is the same
// combination as rolling a 6 then a 5), so every combo below is stored with
// the smaller value first. `normalizePair` sorts an incoming roll the same
// way before it's compared, so we only ever need to list each combo once.
// ---------------------------------------------------------------------------
const LOSING_COMBOS = [
  [1, 1],
  [1, 2],
  [2, 2],
  [4, 4],
];

const WINNING_COMBOS = [
  [3, 3],
  [5, 5],
  [6, 6],
  [5, 6],
];

function normalizePair(die1, die2) {
  return die1 <= die2 ? [die1, die2] : [die2, die1];
}

function pairIsInList(pair, list) {
  return list.some(([a, b]) => a === pair[0] && b === pair[1]);
}

/**
 * Classifies a roll as 'win', 'lose', or 'neutral' for the player who rolled.
 * Exported so the UI/tests can reason about a roll without duplicating rules.
 */
export function evaluateRoll(die1, die2) {
  const pair = normalizePair(die1, die2);
  if (pairIsInList(pair, LOSING_COMBOS)) return 'lose';
  if (pairIsInList(pair, WINNING_COMBOS)) return 'win';
  return 'neutral';
}

const initialState = {
  groupName: '',
  players: [], // full roster entered at setup (2-5 names)
  activePlayers: [], // the 2 players currently facing off, e.g. [players[0], players[1]]
  waitingQueue: [], // players waiting for their shot at the winner
  currentTurn: null, // whose turn it is to roll, among activePlayers
  diceValues: [null, null],
  gameHistory: [],
  status: 'setup', // 'setup' | 'playing' | 'finished'
  winner: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGroupName(state, action) {
      state.groupName = action.payload;
    },

    addPlayer(state, action) {
      const name = action.payload.trim();
      if (!name) return;
      if (state.players.length >= 5) return;
      if (state.players.some((p) => p.toLowerCase() === name.toLowerCase())) return;
      state.players.push(name);
    },

    removePlayer(state, action) {
      state.players = state.players.filter((p) => p !== action.payload);
    },

    // Kicks the match off: first two entered players face each other,
    // everyone else queues up in the order they were added.
    startGame(state) {
      if (state.players.length < 2 || state.players.length > 5) return;
      const [first, second, ...rest] = state.players;
      state.activePlayers = [first, second];
      state.waitingQueue = rest;
      state.currentTurn = first;
      state.diceValues = [null, null];
      state.gameHistory = [
        `${state.groupName || 'The group'} kicked off: ${first} vs ${second}.`,
      ];
      state.status = 'playing';
      state.winner = null;
    },

    // Applies one dice roll for the current active player and resolves the
    // win/loss/neutral outcome, including queue rotation.
    rollDice(state, action) {
      if (state.status !== 'playing') return;
      const { die1, die2 } = action.payload;
      const roller = state.currentTurn;
      const [p1, p2] = state.activePlayers;
      const opponent = roller === p1 ? p2 : p1;

      state.diceValues = [die1, die2];
      const outcome = evaluateRoll(die1, die2);

      if (outcome === 'neutral') {
        // Nothing decided yet — just hand the dice to the other player.
        state.gameHistory.push(
          `${roller} rolled ${die1},${die2} — no decision. ${opponent}'s turn to roll.`
        );
        state.currentTurn = opponent;
        return;
      }

      // Either 'win' or 'lose' ends this individual match: figure out who
      // stays on and who steps out, then bring in the next challenger.
      const matchWinner = outcome === 'win' ? roller : opponent;
      const matchLoser = outcome === 'win' ? opponent : roller;

      state.gameHistory.push(
        outcome === 'win'
          ? `${roller} rolled ${die1},${die2} and won! ${opponent} steps out.`
          : `${roller} rolled ${die1},${die2} and lost! ${opponent} wins the match.`
      );

      if (state.waitingQueue.length > 0) {
        const nextChallenger = state.waitingQueue.shift();
        state.waitingQueue.push(matchLoser); // loser goes to the back of the queue
        state.activePlayers = [matchWinner, nextChallenger];
        state.currentTurn = matchWinner; // winner stays on and rolls first
        state.gameHistory.push(`${nextChallenger} steps up to challenge ${matchWinner}.`);
      } else {
        // No one left waiting — the winner takes the whole group.
        state.status = 'finished';
        state.winner = matchWinner;
        state.gameHistory.push(`${matchWinner} has beaten everyone in the queue and wins!`);
      }
    },

    resetGame() {
      return initialState;
    },
  },
});

export const { setGroupName, addPlayer, removePlayer, startGame, rollDice, resetGame } =
  gameSlice.actions;

// Thunk: generates the actual random dice values (side effect) and hands
// clean numbers to the reducer, which stays a pure function of its inputs.
export const rollDiceThunk = () => (dispatch) => {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  dispatch(rollDice({ die1, die2 }));
};

export default gameSlice.reducer;
