"use strict";

const KNOWN_CSS_CLASSES = {
  board: "game-area__board",
  row: "board__row",
  tile: "row__tile",
  whiteChecker: "checker--white",
  redChecker: "checker--red",
  checker: "checker",
  startGameButton: "game-area__button",
  scoreboard: "main-content__score-area",

  playersScoreboards: {
    both: {
      scoreboard: "score-area__player",
    status: "player__status",
    },
    p1: {
      piecesRemaining: "pieces__remaining--p1",
    },
    p2: {
      piecesRemaining: "pieces__remaining--p2",
    },
  },
  gameStatus: {
    gameStarted: "game-started",
    playerTurnActive: "status--active",
    selectedTile: "selected-tile",
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

const KNOWN_MOVEMENT_DIRECTIONS = {
  topDown: "topDown",
  bottomUp: "bottomUp",
};

const KNOWN_TYPES = {
  undefined: "undefined",
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
      movementDirection: KNOWN_MOVEMENT_DIRECTIONS.topDown,
    },
    p2: {
      checkerIdentifier: 2,
      checkerClass: KNOWN_CSS_CLASSES.redChecker,
      id: "p2",
      movementDirection: KNOWN_MOVEMENT_DIRECTIONS.bottomUp,
    },
  },
};

const appState = {
  game: {
    checkersStatus: {
      value: null,
      isSelectingMovement: false,
      selectedTileWithCheckerId: null,
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

// TODO: Find where to fit these variables into appState.
let availableMovements = null;
let clickedChecker = null;

const renderNewTurn = () => {
  const isP1CurrentTurnOwner =
    appState.game.turns.currentTurn === GAME_CONFIG.players.p1.id;

  const [scoreboard] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.scoreboard
  );

  const [player1Scoreboard, player2Scoreboard] =
    scoreboard.getElementsByClassName(
      KNOWN_CSS_CLASSES.playersScoreboards.both.scoreboard
    );

  const [p1Status] = player1Scoreboard.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.both.status
  );

  const [p2Status] = player2Scoreboard.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.both.status
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

const generateTileId = (rowIndex, cellIndex) =>
  `row-${rowIndex}-tile-${cellIndex}`;

const getAvailableMovements = (row, column) => {
  const reducerFunction = (
    accumulator,
    currentRow,
    currentRowIndex,
    sourceArray
  ) => {
    accumulator.push(
      currentRow.map((cell, currentCellIndex) => {
        const currentPlayer = appState.game.turns.currentTurn;
        if (
          GAME_CONFIG.players[currentPlayer].movementDirection ===
          KNOWN_MOVEMENT_DIRECTIONS.topDown
        ) {
          //TODO: FIX THIS FOR GOD'S SAKE 😰 (nice code, dude)
          if (currentRowIndex === row + 1) {
            if (
              currentCellIndex === column + 1 ||
              currentCellIndex === column - 1
            ) {
              if (
                cell !== GAME_CONFIG.players.p1.checkerIdentifier &&
                cell !== GAME_CONFIG.players.p2.checkerIdentifier
              ) {
                return [currentRowIndex, currentCellIndex];
              } else {
                if (cell === GAME_CONFIG.players.p2.checkerIdentifier) {
                  if (
                    sourceArray[currentRowIndex + 1] &&
                    sourceArray[currentRowIndex + 1][
                      currentCellIndex < column ? column - 2 : column + 2
                    ] == null
                  ) {
                    return [
                      currentRowIndex + 1,
                      currentCellIndex < column ? column - 2 : column + 2,
                      {
                        eatenCell: {
                          row: currentRowIndex,
                          column: currentCellIndex,
                          owner: cell,
                        },
                      },
                    ];
                  }
                }
              }
            }
          }
        } else {
          if (currentRowIndex === row - 1) {
            if (
              currentCellIndex === column + 1 ||
              currentCellIndex === column - 1
            ) {
              if (
                cell !== GAME_CONFIG.players.p1.checkerIdentifier &&
                cell !== GAME_CONFIG.players.p2.checkerIdentifier
              ) {
                return [currentRowIndex, currentCellIndex];
              } else {
                if (cell === GAME_CONFIG.players.p1.checkerIdentifier) {
                  if (
                    sourceArray[currentRowIndex - 1] &&
                    sourceArray[currentRowIndex - 1][
                      currentCellIndex < column ? column - 2 : column + 2
                    ] === null
                  ) {
                    return [
                      currentRowIndex - 1,
                      currentCellIndex < column ? column - 2 : column + 2,
                      {
                        eatenCell: {
                          row: currentRowIndex,
                          column: currentCellIndex,
                          owner: cell,
                        },
                      },
                    ];
                  }
                }
              }
            }
          }
        }
      })
    );
    return accumulator
      .map((item) =>
        item.filter((item) => typeof item !== KNOWN_TYPES.undefined)
      )
      .filter((item) => item.length > 0);
  };
  return appState.game.checkersStatus.value.reduce(reducerFunction, []);
};

const onClickTileHandler = ({
  element: tile,
  position: {
    rowIndex: clickedTileRowIndex,
    cellIndex: clickedTileColumnIndex,
  },
}) => {
  // console.log(appState.game.checkersStatus);
  const hasOwnChecker =
    appState.game.turns.currentTurn != null &&
    !!tile.querySelector(
      `.${GAME_CONFIG.players[appState.game.turns.currentTurn].checkerClass}`
    );

  const highlightedTiles = Array.from(
    document.getElementsByClassName(KNOWN_CSS_CLASSES.gameStatus.selectedTile)
  );

  for (const tile of highlightedTiles) {
    tile.classList.remove(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
  }

  if (hasOwnChecker) {
    // Borrar todos los colores de las celdas que tengan esa clase
    appState.game.checkersStatus.selectedTileWithCheckerId = generateTileId(
      rowIndex,
      cellIndex
    );
    tile.classList.add(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
    const availableMovements = getAvailableMovements(rowIndex, cellIndex);

    renderAvailableMovements(clickedTileRowIndex, clickedTileColumnIndex);
    appState.game.checkersStatus.isSelectingMovement = true;
  }

  if (appState.game.checkersStatus.isSelectingMovement) {
    const availableMovements = getAvailableMovements(rowIndex, cellIndex);
    for (const availableMovement of availableMovements) {
      for (const tile of availableMovement) {
        const [tileRow, tileColumn] = tile;
        if (tileRow === rowIndex && tileColumn === cellIndex) {
          const selectedTile = document.getElementById(
            appState.game.checkersStatus.selectedTileWithCheckerId
          );
          const checker = selectedTile.getElementsByClassName(
            KNOWN_CSS_CLASSES.checker
          );

          appState.game.checkersStatus.value[rowIndex][cellIndex] = null;

          appState.game.checkersStatus.value[tileRow][tileColumn] =
            GAME_CONFIG.players[
              appState.game.turns.currentTurn
            ].checkerIdentifier;

          const [boardElement] = document.getElementsByClassName(
            KNOWN_CSS_CLASSES.board
          );

          renderRows(boardElement, appState.game.checkersStatus.value);
          appState.game.checkersStatus.isSelectingMovement = false;
          // 1.1.2 Clickee un posible movimiento
        }
      }
    }
    renderNewTurn();
  }
};

const renderRows = (boardElement, initialBoardMatrix) => {
  const rowElementParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.row,
    elementCssClass: KNOWN_CSS_CLASSES.row,
  };

  const rowElement = getContentFromHTMLTemplate(rowElementParams);

  const tileElementParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.tile,
    elementCssClass: KNOWN_CSS_CLASSES.tile,
  };

  const tileElement = getContentFromHTMLTemplate(tileElementParams);

  const whiteCheckerParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.checkers.white,
    elementCssClass: KNOWN_CSS_CLASSES.whiteChecker,
  };

  const whiteCheckerElement = getContentFromHTMLTemplate(whiteCheckerParams);

  const redCheckerParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.checkers.red,
    elementCssClass: KNOWN_CSS_CLASSES.redChecker,
  };

  const redCheckerElement = getContentFromHTMLTemplate(redCheckerParams);

  initialBoardMatrix.forEach((row, rowIndex) => {
    const clonedRow = rowElement.cloneNode(true);
    row.forEach((cell, cellIndex) => {
      const clonedTile = tileElement.cloneNode(true);
      clonedTile.id = generateTileId(rowIndex, cellIndex);
      clonedTile.addEventListener(KNOWN_EVENT_NAMES.onClick, () => {
        onClickTileHandler({
          element: clonedTile,
          position: {
            rowIndex,
            cellIndex,
          },
        });
      });
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

const hideButtonShowScores = () => {
  const [gameScoreboard] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.scoreboard
  );
  gameScoreboard.classList.add(KNOWN_CSS_CLASSES.gameStatus.gameStarted);
  startGameButton.classList.add(KNOWN_CSS_CLASSES.gameStatus.gameStarted);
};

const [startGameButton] = document.getElementsByClassName(
  KNOWN_CSS_CLASSES.startGameButton
);

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

  appState.game.checkersStatus.value = initialBoardMatrix;

  renderRows(boardElement, initialBoardMatrix);

  startGameButton.addEventListener(KNOWN_EVENT_NAMES.onClick, startGame);
};

const startGame = () => {
  hideButtonShowScores();
  appState.game.turns.currentTurn = GAME_CONFIG.players.p1.id;
};

function renderAvailableMovements(rowIndex, cellIndex) {
  const availableMovements = getAvailableMovements(rowIndex, cellIndex);

  for (const item of availableMovements) {
    for (const emptyTile of item) {
      const [row, col] = emptyTile;
      const tileID = generateTileId(row, col);
      const tile = document.getElementById(tileID);
      tile?.classList.add(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
    }
  }
}

window.onload = bootstrapApp(GAME_CONFIG);
