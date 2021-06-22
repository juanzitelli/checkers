const KNOWN_CSS_CLASSES = {
  board: "game-area__board",
  row: "board__row",
  tile: "row__tile",
  whiteChecker: "checker--white",
  redChecker: "checker--red",
  startGameButton: "game-area__button",
  scoreboard: "main-content__score-area",
  playersScoreboards: {
    both: "score-area__player",
    status: "player__status",
    p1: "score-area__player player1",
    p2: "score-area__player player2",
  },
  gameStatus: {
    gameStarted: "game-started",
    playerTurnActive: "status--active",
  },
};

const KNOWN_EVENT_NAMES = {
  onClick: "click",
};

const FIXTURE_TEXT = {
  game: {
    turns: {
      activeTurn: "Active turn",
      waiting: "Waiting",
    },
  },
};

const KNOWN_HTML_TEMPLATE_IDS = {
  board: {
    row: "row",
    tile: "tile",
    checkers: {
      red: "red-piece",
      white: "white-piece",
    },
  },
};

const GAME_CONFIG = {
  board: {
    dimension: 8,
    checkersRows: 3,
  },
  players: {
    p1: {
      checkerIdentifier: 1,
      checkerClass: KNOWN_CSS_CLASSES.whiteChecker,
      id: "p1",
    },
    p2: {
      checkerIdentifier: 2,
      checkerClass: KNOWN_CSS_CLASSES.redChecker,
      id: "p2",
    },
  },
};

const appState = {
  game: {
    checkersStatus: {
      value: null,
    },
    turns: {
      currentTurn: null,
    },
    players: {
      p1: {
        checkersLeft: 12,
      },
      p2: {
        checkersLeft: 12,
      },
    },
  },
};
const renderNewTurn = () => {
  const isP1CurrentTurnOwner =
    appState.game.turns.currentTurn === GAME_CONFIG.players.p1.id;

  const [scoreboard] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.scoreboard
  );

  const [player1Scoreboard, player2Scoreboard] =
    scoreboard.getElementsByClassName(
      KNOWN_CSS_CLASSES.playersScoreboards.both
    );

  const [p1Status] = player1Scoreboard.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.status
  );

  const [p2Status] = player2Scoreboard.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.status
  );

  if (isP1CurrentTurnOwner) {
    player1Scoreboard.classList.toggle(
      KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
    );
    player2Scoreboard.classList.toggle(
      KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
    );
  } else {
    player1Scoreboard.classList.toggle(
      KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
    );
    player2Scoreboard.classList.toggle(
      KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
    );
  }

  const {
    game: {
      turns: { waiting, activeTurn },
    },
  } = FIXTURE_TEXT;

  p1Status.innerText = isP1CurrentTurnOwner ? waiting : activeTurn;
  p2Status.innerText = isP1CurrentTurnOwner ? activeTurn : waiting;

  appState.game.turns.currentTurn = isP1CurrentTurnOwner
    ? GAME_CONFIG.players.p2.id
    : GAME_CONFIG.players.p1.id;
};

const getContentFromHTMLTemplate = ({ templateId, elementCssClass }) => {
  const template = document.getElementById(templateId).content.cloneNode(true);
  return document
    .importNode(template, true)
    .querySelector(`.${elementCssClass}`);
};

const renderRows = (boardElement, initialBoardMatrix) => {
  const rowElementParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.row,
    elementCssClass: KNOWN_CSS_CLASSES.row,
  };

  const rowElement = getContentFromTemplate(rowElementParams);

  const tileElementParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.tile,
    elementCssClass: KNOWN_CSS_CLASSES.tile,
  };

  const tileElement = getContentFromTemplate(tileElementParams);

  const whiteCheckerParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.checkers.white,
    elementCssClass: KNOWN_CSS_CLASSES.whiteChecker,
  };

  const whiteCheckerElement = getContentFromTemplate(whiteCheckerParams);

  const redCheckerParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.checkers.red,
    elementCssClass: KNOWN_CSS_CLASSES.redChecker,
  };

  const redCheckerElement = getContentFromTemplate(redCheckerParams);

  initialBoardMatrix.forEach((row) => {
    const clonedRow = rowElement.cloneNode(true);
    row.forEach((cell) => {
      const clonedTile = tileElement.cloneNode(true);
      switch (cell) {
        case 1:
          const clonedWhiteChecker = whiteCheckerElement.cloneNode(true);
          clonedTile.appendChild(clonedWhiteChecker);
          clonedRow.appendChild(clonedTile);
          break;
        case 2:
          const clonedRedChecker = redCheckerElement.cloneNode(true);
          clonedTile.appendChild(clonedRedChecker);
          clonedRow.appendChild(clonedTile);
          break;

        default:
          clonedRow.appendChild(clonedTile);
          break;
      }
    });
    boardElement.appendChild(clonedRow);
  });
};

const getInitialBoardMatrix = ({ dimension, checkersRows, players }) => {
  // TODO: Merge these two functions into a single one.
  const player1Rows = [...Array(dimension).keys()].filter(
    (_, index) => index < checkersRows
  );

  const player2Rows = [...Array(dimension).keys()].filter(
    (_, index) => index >= dimension - checkersRows
  );

  const getCheckerIdentifier = (rowId, cellId) => {
    // TODO: Abstract this function and make it less verbose.
    if (player1Rows.includes(rowId)) {
      if (rowId % 2 !== 0) {
        if (cellId % 2 === 0) {
          return players.p1.checkerIdentifier;
        }
      } else {
        if (cellId % 2 !== 0) {
          return players.p1.checkerIdentifier;
        }
      }
    } else if (player2Rows.includes(rowId)) {
      if (rowId % 2 !== 0) {
        if (cellId % 2 === 0) {
          return players.p2.checkerIdentifier;
        }
      } else {
        if (cellId % 2 !== 0) {
          return players.p2.checkerIdentifier;
        }
      }
    }
  };

  return Array(dimension)
    .fill(null)
    .map((_, rowId) =>
      Array(dimension)
        .fill(null)
        .map((_, cellId) => getCheckerIdentifier(rowId, cellId) ?? null)
    );
};

const bootstrapApp = ({ players, board: { dimension, checkersRows } }) => {
  const [boardElement] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.board
  );

  const matrixGenerationParams = {
    dimension,
    checkersRows,
    players,
  };

  const initialBoardMatrix = getInitialBoardMatrix(matrixGenerationParams);
  renderRows(boardElement, initialBoardMatrix);
};

window.onload = bootstrapApp(GAME_CONFIG);
