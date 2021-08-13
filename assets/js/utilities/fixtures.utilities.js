export const KNOWN_CSS_CLASSES = {
  board: "game-area__board",
  checker: "checker",
  redChecker: "checker--red",
  whiteChecker: "checker--white",
  whiteKing: "king--white",
  redKing: "king--red",
  row: "board__row",
  scoreboard: "main-content__score-area",
  startGameButton: "game-area__button",
  tile: "row__tile",
  playersScoreboards: {
    both: {
      scoreboard: "score-area__player",
      status: "player__status",
    },
    p1: {
      name: "player-1__name",
      score: "pieces__score--p1",
    },
    p2: {
      name: "player-2__name",
      score: "pieces__score--p2",
    },
  },
  historyModule: {
    historyModuleContainer: "history-module__container",
    historyGame: "history-game__container",
    result: "history-game__result",
    players: "history-game__players",
  },
  gameStatus: {
    gameStarted: "game-started",
    playerTurnActive: "status--active",
    selectedTile: "selected-tile",
  },
};

export const FIXTURE_TEXT = {
  game: {
    turns: {
      activeTurn: "Active turn",
      waiting: "Waiting",
    },
  },
};

export const KNOWN_IDS = {
  buttons: {
    startGame: "start-game-button",
    loadGame: "load-game-button",
    saveGame: "save-game-button",
  },
  inputs: {
    dateFilter: "filter__date",
    scoreFilter: "filter__score",
  },
  historyModule: {
    modal: "history-module-modal",
    modalTrigger: "history-module__modal-trigger",
  },
};

export const KNOWN_HTML_TEMPLATE_IDS = {
  board: {
    row: "row",
    tile: "tile",
    checkers: {
      red: "red-piece",
      white: "white-piece",
    },
    historyModule: {
      historyGame: "history-game",
    },
    kings: {
      red: "red-king",
      white: "white-king",
    },
  },
};

export const KNOWN_MOVEMENT_DIRECTIONS = {
  topDown: "topDown",
  bottomUp: "bottomUp",
};

export const GAME_CONFIG = {
  board: {
    dimension: 8,
    checkersRows: 3,
  },
  players: {
    p1: {
      checkerIdentifier: 1,
      kingIdentifier: 10,
      checkerClass: KNOWN_CSS_CLASSES.whiteChecker,
      kingClass: KNOWN_CSS_CLASSES.whiteKing,
      id: "p1",
      movementDirection: KNOWN_MOVEMENT_DIRECTIONS.topDown,
      kingRow: 7,
    },
    p2: {
      checkerIdentifier: 2,
      kingIdentifier: 20,
      checkerClass: KNOWN_CSS_CLASSES.redChecker,
      kingClass: KNOWN_CSS_CLASSES.redKing,
      id: "p2",
      movementDirection: KNOWN_MOVEMENT_DIRECTIONS.bottomUp,
      kingRow: 0,
    },
  },
};
