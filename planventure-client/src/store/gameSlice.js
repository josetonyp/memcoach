import { createSlice } from "@reduxjs/toolkit";

// Load configuration from localStorage with fallback defaults
const loadConfig = () => {
  const pairsCount = localStorage.getItem("memoryGame_pairsCount");
  const memorizeTime = localStorage.getItem("memoryGame_memorizeTime");
  const timerEnabled = localStorage.getItem("memoryGame_timerEnabled");
  const wordsCount = localStorage.getItem("wordsGame_wordsCount");
  const wordsColumns = localStorage.getItem("wordsGame_columns");
  const wordsDictionary = localStorage.getItem("wordsGame_dictionary");

  return {
    pairsCount: pairsCount ? Number(pairsCount) : 5,
    memorizeTime: memorizeTime ? Number(memorizeTime) : 8,
    timerEnabled: timerEnabled ? timerEnabled === "true" : true,
    wordsCount: wordsCount ? Number(wordsCount) : 10,
    wordsColumns: wordsColumns ? Number(wordsColumns) : 2,
    wordsDictionary: wordsDictionary || "/words.txt",
  };
};

const config = loadConfig();

const initialState = {
  pairs: [],
  pairsCount: config.pairsCount,
  chunkedPairs: [],
  memorizeTime: config.memorizeTime,
  timerEnabled: config.timerEnabled,
  timerRemaining: 0,
  phase: "ready", // ready | showing | input | result
  inputValue: "",
  result: null,
  highScore: null,
  showing: false,
  // history of completed verification attempts
  history: [],
  // track the current live game id when a round is started
  currentGameId: null,
  // elapsed timers in milliseconds
  memorizeElapsed: 0, // milliseconds from Start to Verify
  guessElapsed: 0, // milliseconds from Verify to successful validation or Cancel

  // Words game state
  words: [],
  wordsCount: config.wordsCount,
  wordsColumns: config.wordsColumns,
  wordsDictionary: config.wordsDictionary,
  chunkedWords: [],
  wordsInputValue: "",
  wordsResult: null,
  wordsHistory: [],
  wordsCurrentGameId: null,
  wordsMemorizeElapsed: 0,
  wordsGuessElapsed: 0,
  availableDictionaries: ["/words.txt"],
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setPairsCount(state, action) {
      state.pairsCount = action.payload;
      localStorage.setItem("memoryGame_pairsCount", String(action.payload));
    },
    setMemorizeTime(state, action) {
      state.memorizeTime = action.payload;
      localStorage.setItem("memoryGame_memorizeTime", String(action.payload));
    },
    setTimerEnabled(state, action) {
      state.timerEnabled = !!action.payload;
      localStorage.setItem("memoryGame_timerEnabled", String(!!action.payload));
    },
    setInputValue(state, action) {
      state.inputValue = action.payload;
    },
    setPairs(state, action) {
      state.pairs = action.payload;
    },
    startRound(state, action) {
      // payload: { pairs }
      state.pairs = action.payload.pairs;
      state.chunkedPairs = action.payload.chunkedPairs;
      state.phase = "showing";
      state.showing = true;
      // respect timerEnabled: if disabled, keep timerRemaining at 0 until user hides
      state.timerRemaining = state.timerEnabled ? state.memorizeTime : 0;
      state.inputValue = "";
      state.result = null;
      state.memorizeElapsed = 0;
      state.guessElapsed = 0;

      // create a new game entry and set it as current
      const gameId = Date.now();
      const gameEntry = {
        id: gameId,
        startDate: new Date().toISOString(),
        pairs: state.pairs.slice(),
        attempts: [],
        pairsCount: state.pairsCount,
        memorizeTime: state.memorizeTime,
        completed: false,
      };
      state.history = [gameEntry, ...(state.history || [])].slice(0, 100);
      state.currentGameId = gameId;
    },
    tick(state) {
      if (state.timerRemaining > 0) {
        state.timerRemaining -= 1;
      }
      if (state.timerRemaining <= 0) {
        state.timerRemaining = 0;
        state.showing = false;
        state.phase = "input";
      }
    },
    hideNow(state) {
      state.showing = false;
      state.phase = "input";
      state.timerRemaining = 0;
      state.guessElapsed = 0;
    },
    verifyInput(state, action) {
      // payload: { cleaned }
      const cleaned = action.payload.cleaned || [];
      const total = state.pairs.length;
      const correct = state.pairs.reduce(
        (acc, p, idx) => acc + (cleaned[idx] === p ? 1 : 0),
        0
      );
      // determine if this is a new high score
      const percent = Math.round((correct / total) * 100);
      let isNewHigh = false;
      if (!state.highScore || percent > state.highScore.percent) {
        state.highScore = {
          percent,
          correct,
          total,
          pairsCount: state.pairsCount,
          memorizeTime: state.memorizeTime,
          date: new Date().toISOString(),
        };
        isNewHigh = true;
      }

      state.result = {
        correct,
        total,
        expected: state.pairs,
        provided: cleaned,
        isNewHigh,
      };
      state.phase = "result";

      // append this attempt to the current game (create fallback if missing)
      const attempt = {
        id: Date.now(),
        date: new Date().toISOString(),
        provided: Array.isArray(cleaned) ? cleaned.slice() : cleaned || [],
        correct,
        total,
        percent,
        memorizeElapsed: state.memorizeElapsed,
        guessElapsed: state.guessElapsed,
      };

      let gIndex = -1;
      if (state.currentGameId) {
        gIndex = (state.history || []).findIndex(
          (g) => g.id === state.currentGameId
        );
      }
      if (gIndex === -1) {
        // fallback: create a new game entry
        const gameId = Date.now() + 1;
        const gameEntry = {
          id: gameId,
          startDate: new Date().toISOString(),
          pairs: state.pairs.slice(),
          attempts: [attempt],
          pairsCount: state.pairsCount,
          memorizeTime: state.memorizeTime,
          completed: true,
        };
        state.history = [gameEntry, ...(state.history || [])].slice(0, 100);
      } else {
        // prepend attempt to the game's attempts list
        const g = state.history[gIndex];
        g.attempts = [attempt, ...(g.attempts || [])].slice(0, 100);
        g.completed = true;
        // update history array with modified game at front
        state.history[gIndex] = g;
        // clear current game id since the game is completed
        state.currentGameId = null;
      }
    },

    reset(state) {
      // if there is a current game with no attempts, remove it from history
      if (state.currentGameId) {
        const idx = (state.history || []).findIndex(
          (g) => g.id === state.currentGameId
        );
        if (idx !== -1) {
          const g = state.history[idx];
          if (!g.attempts || g.attempts.length === 0) {
            state.history = state.history.filter(
              (x) => x.id !== state.currentGameId
            );
          }
        }
      }

      state.phase = "ready";
      state.inputValue = "";
      state.result = null;
      state.timerRemaining = 0;
      state.pairs = [];
      state.pairsCount = config.pairsCount;
      state.chunckedPairs = [];
      state.showing = false;
      state.currentGameId = null;
      state.memorizeElapsed = 0;
      state.guessElapsed = 0;
    },
    setHighScore(state, action) {
      state.highScore = action.payload;
    },

    tickMemorizeElapsed(state) {
      state.memorizeElapsed += 100;
    },
    tickGuessElapsed(state) {
      state.guessElapsed += 100;
    },

    // record an attempt to history without changing phase/result (useful for failed guesses)
    recordAttempt(state, action) {
      const cleaned = action.payload.cleaned || [];
      const total = state.pairs.length;
      const correct = state.pairs.reduce(
        (acc, p, idx) => acc + (cleaned[idx] === p ? 1 : 0),
        0
      );
      const percent = Math.round((correct / (total || 1)) * 100);
      const attempt = {
        id: Date.now(),
        date: new Date().toISOString(),
        provided: Array.isArray(cleaned) ? cleaned.slice() : cleaned || [],
        correct,
        total,
        percent,
      };

      // attach attempt to current game, or create a fallback game
      let gIndex = -1;
      if (state.currentGameId) {
        gIndex = (state.history || []).findIndex(
          (g) => g.id === state.currentGameId
        );
      }

      if (gIndex === -1) {
        const gameId = Date.now();
        const gameEntry = {
          id: gameId,
          startDate: new Date().toISOString(),
          pairs: state.pairs.slice(),
          attempts: [attempt],
          pairsCount: state.pairsCount,
          memorizeTime: state.memorizeTime,
          completed: false,
        };
        state.history = [gameEntry, ...(state.history || [])].slice(0, 100);
        state.currentGameId = gameId;
      } else {
        const g = state.history[gIndex];
        g.attempts = [attempt, ...(g.attempts || [])].slice(0, 100);
        state.history[gIndex] = g;
      }
    },

    clearHistory(state) {
      state.history = [];
    },

    // Words Game Actions
    setWordsCount(state, action) {
      state.wordsCount = action.payload;
      localStorage.setItem("wordsGame_wordsCount", String(action.payload));
    },
    setWordsColumns(state, action) {
      state.wordsColumns = action.payload;
      localStorage.setItem("wordsGame_columns", String(action.payload));
    },
    setWordsDictionary(state, action) {
      state.wordsDictionary = action.payload;
      localStorage.setItem("wordsGame_dictionary", action.payload);
    },
    setWordsInputValue(state, action) {
      state.wordsInputValue = action.payload;
    },
    setWords(state, action) {
      state.words = action.payload;
    },
    startWordsRound(state, action) {
      // payload: { words, chunkedWords }
      state.words = action.payload.words;
      state.chunkedWords = action.payload.chunkedWords;
      state.phase = "showing";
      state.showing = true;
      state.timerRemaining = state.timerEnabled ? state.memorizeTime : 0;
      state.wordsInputValue = "";
      state.wordsResult = null;
      state.wordsMemorizeElapsed = 0;
      state.wordsGuessElapsed = 0;

      // create a new game entry
      const gameId = Date.now();
      const gameEntry = {
        id: gameId,
        startDate: new Date().toISOString(),
        words: state.words.slice(),
        attempts: [],
        wordsCount: state.wordsCount,
        memorizeTime: state.memorizeTime,
        completed: false,
      };
      state.wordsHistory = [gameEntry, ...(state.wordsHistory || [])].slice(
        0,
        100
      );
      state.wordsCurrentGameId = gameId;
    },
    verifyWordsInput(state, action) {
      // payload: { cleaned } - array of words entered by user
      const cleaned = action.payload.cleaned || [];
      const total = state.words.length;
      const correct = state.words.reduce(
        (acc, word, idx) =>
          acc + (cleaned[idx]?.toLowerCase() === word.toLowerCase() ? 1 : 0),
        0
      );
      const percent = Math.round((correct / total) * 100);

      state.wordsResult = {
        correct,
        total,
        expected: state.words,
        provided: cleaned,
        percent,
      };
      state.phase = "result";

      // record attempt
      const attempt = {
        id: Date.now(),
        date: new Date().toISOString(),
        provided: Array.isArray(cleaned) ? cleaned.slice() : cleaned || [],
        correct,
        total,
        percent,
        memorizeElapsed: state.wordsMemorizeElapsed,
        guessElapsed: state.wordsGuessElapsed,
      };

      let gIndex = -1;
      if (state.wordsCurrentGameId) {
        gIndex = (state.wordsHistory || []).findIndex(
          (g) => g.id === state.wordsCurrentGameId
        );
      }
      if (gIndex === -1) {
        const gameId = Date.now() + 1;
        const gameEntry = {
          id: gameId,
          startDate: new Date().toISOString(),
          words: state.words.slice(),
          attempts: [attempt],
          wordsCount: state.wordsCount,
          memorizeTime: state.memorizeTime,
          completed: true,
        };
        state.wordsHistory = [gameEntry, ...(state.wordsHistory || [])].slice(
          0,
          100
        );
      } else {
        const g = state.wordsHistory[gIndex];
        g.attempts = [attempt, ...(g.attempts || [])].slice(0, 100);
        g.completed = true;
        state.wordsHistory[gIndex] = g;
        state.wordsCurrentGameId = null;
      }
    },
    resetWords(state) {
      // cleanup incomplete game
      if (state.wordsCurrentGameId) {
        const idx = (state.wordsHistory || []).findIndex(
          (g) => g.id === state.wordsCurrentGameId
        );
        if (idx !== -1) {
          const g = state.wordsHistory[idx];
          if (!g.attempts || g.attempts.length === 0) {
            state.wordsHistory = state.wordsHistory.filter(
              (x) => x.id !== state.wordsCurrentGameId
            );
          }
        }
      }

      state.phase = "ready";
      state.wordsInputValue = "";
      state.wordsResult = null;
      state.timerRemaining = 0;
      state.words = [];
      state.chunkedWords = [];
      state.showing = false;
      state.wordsCurrentGameId = null;
      state.wordsMemorizeElapsed = 0;
      state.wordsGuessElapsed = 0;
    },
    tickWordsMemorizeElapsed(state) {
      state.wordsMemorizeElapsed += 100;
    },
    tickWordsGuessElapsed(state) {
      state.wordsGuessElapsed += 100;
    },
    clearWordsHistory(state) {
      state.wordsHistory = [];
    },
  },
  extraReducers: (builder) => {
    // perform a cleanup/migration when rehydrated from storage
    builder.addCase("persist/REHYDRATE", (state, action) => {
      const incoming = action.payload && action.payload.game;
      if (!incoming || !incoming.history) return;
      const hist = incoming.history || [];
      const cleaned = hist.flatMap((h) => {
        if (!h || typeof h !== "object") return [];
        // Already a game with attempts
        if (Array.isArray(h.attempts) && h.attempts.length > 0) return [h];
        // Legacy flat entry with a provided attempt
        if (Array.isArray(h.provided) && h.provided.length > 0) {
          const attempt = {
            id: h.id || Date.now(),
            date: h.date || new Date().toISOString(),
            provided: h.provided.slice(),
            correct: h.correct || 0,
            total: h.total || h.provided.length,
            percent: h.percent || 0,
          };
          return [
            {
              id: h.id || Date.now(),
              startDate: h.date || new Date().toISOString(),
              pairs: h.pairs || [],
              attempts: [attempt],
              pairsCount: h.pairsCount,
              memorizeTime: h.memorizeTime,
              completed: attempt.percent === 100,
            },
          ];
        }
        // No attempts / no provided answers -> drop this legacy entry
        return [];
      });
      state.history = cleaned.slice(0, 100);
      // restore currentGameId if it still exists in cleaned history
      if (
        incoming.currentGameId &&
        cleaned.find((g) => g.id === incoming.currentGameId)
      ) {
        state.currentGameId = incoming.currentGameId;
      } else {
        state.currentGameId = null;
      }
    });
  },
});

export const {
  setPairsCount,
  setMemorizeTime,
  setTimerEnabled,
  setInputValue,
  setPairs,
  startRound,
  tick,
  hideNow,
  verifyInput,
  reset,
  setHighScore,
  tickMemorizeElapsed,
  tickGuessElapsed,
  recordAttempt,
  clearHistory,
  // Words game exports
  setWordsCount,
  setWordsColumns,
  setWordsDictionary,
  setWordsInputValue,
  setWords,
  startWordsRound,
  verifyWordsInput,
  resetWords,
  tickWordsMemorizeElapsed,
  tickWordsGuessElapsed,
  clearWordsHistory,
} = gameSlice.actions;

export default gameSlice.reducer;
