"use strict";

import {
  KNOWN_CSS_CLASSES,
  FIXTURE_TEXT,
  KNOWN_HTML_TEMPLATE_IDS,
  KNOWN_MOVEMENT_DIRECTIONS,
  KNOWN_IDS,
  GAME_CONFIG,
} from "./utilities/fixtures.utilities.js";

import {
  getContentFromHTMLTemplate,
  generateTileId,
} from "./utilities/dom.utilities.js";

import useHistoryModule from "./hooks/useHistoryModule.js";
import useLocalStorageState from "./hooks/useLocalStorageState.js";

const appState = {
  game: {
    status: {
      value: null,
      isSelectingMovement: false,
      gameStatus: "awaitingStart",
    },
    turns: {
      current: null,
    },
    players: {
      p1: {
        checkersCounter: 12,
        name: "Player 1",
        score: 0,
      },
      p2: {
        checkersCounter: 12,
        name: "Player 2",
        score: 0,
      },
    },
  },
};

let availableMovements = null;
let clickedChecker = null;
let movementType;

const renderTurnSwap = () => {
  const isP1CurrentTurnOwner =
    appState.game.turns.current === GAME_CONFIG.players.p1.id;

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

  appState.game.turns.current = isP1CurrentTurnOwner
    ? GAME_CONFIG.players.p2.id
    : GAME_CONFIG.players.p1.id;

  const isTie = isGameTied();

  if (isTie) {
    const { addGameToHistory } = useLocalStorageState();

    const date = new Date();

    const addGameToHistoryConfig = {
      result: "Draw",
      date: date.toDateString(),
      dateValue: date,
      players: {
        p1: {
          P1Name: appState.game.players.p1.name,
          P1Score: appState.game.players.p1.score,
        },
        p2: {
          P2Name: appState.game.players.p2.name,
          P2Score: appState.game.players.p2.score,
        },
      },
    };

    addGameToHistory({ addGameToHistoryConfig });

    const { renderHistoryGames } = useHistoryModule();

    const { getGamesHistory } = useLocalStorageState();

    const historyGames = getGamesHistory();

    renderHistoryGames({ historyGames });
    window.location.reload();
  }
};

const getPieceAvailableMovements = ({ row, column }) => {
  const cornerTiles = {
    [KNOWN_MOVEMENT_DIRECTIONS.topDown]: [
      { tileRow: row + 1, tileColumn: column + 1 },
      { tileRow: row + 1, tileColumn: column - 1 },
    ],
    [KNOWN_MOVEMENT_DIRECTIONS.bottomUp]: [
      { tileRow: row - 1, tileColumn: column + 1 },
      { tileRow: row - 1, tileColumn: column - 1 },
    ],
  };

  const currentPlayerCornerTiles =
    cornerTiles[
      GAME_CONFIG.players[appState.game.turns.current].movementDirection
    ];

  const adjacentRivalPieces = getAdjacentRivalPieces({
    cornerTiles: currentPlayerCornerTiles,
  });

  const isP1 =
    GAME_CONFIG.players[appState.game.turns.current].movementDirection ===
    KNOWN_MOVEMENT_DIRECTIONS.topDown;

  const availableTargetCells = adjacentRivalPieces
    .map(({ tileRow, tileColumn }) => {
      const leftColumn = tileColumn - 1;
      const rightColumn = tileColumn + 1;

      if (isP1) {
        const bottomRow = tileRow + 1;

        const targetRow = appState.game.status.value[bottomRow];

        if (!targetRow) {
          return null;
        }

        if (tileColumn > column) {
          const targetCell = targetRow[rightColumn];

          return targetCell === null
            ? {
                eatenPiece: { row: tileRow, column: tileColumn },
                targetCell: { row: bottomRow, column: rightColumn },
              }
            : null;
        }

        const targetCell = targetRow[leftColumn];

        return targetCell === null
          ? {
              eatenPiece: { row: tileRow, column: tileColumn },
              targetCell: { row: bottomRow, column: leftColumn },
            }
          : null;
      }

      const upperRow = tileRow - 1;

      const targetRow = appState.game.status.value[upperRow];

      if (!targetRow) {
        return null;
      }

      if (tileColumn > column) {
        const targetCell = targetRow[rightColumn];

        return targetCell === null
          ? {
              eatenPiece: { row: tileRow, column: tileColumn },
              targetCell: { row: upperRow, column: rightColumn },
            }
          : null;
      }

      const targetCell = targetRow[leftColumn];

      return targetCell === null
        ? {
            eatenPiece: { row: tileRow, column: tileColumn },
            targetCell: { row: upperRow, column: leftColumn },
          }
        : null;
    })
    .filter((item) => item !== null);

  const adjacentEmptyTiles = currentPlayerCornerTiles.filter(
    ({ tileRow, tileColumn }) => {
      const targetRow = appState.game.status.value[tileRow];

      if (!targetRow) {
        return false;
      }

      const targetCell = targetRow[tileColumn];

      return targetCell === null;
    }
  );

  const movement = {
    type: "movement",
    movements: adjacentEmptyTiles,
  };

  const capture = {
    type: "capture",
    movements: availableTargetCells,
  };

  return capture.movements.length > 0 ? capture : movement;
};

const getKingAvailableMovements = ({ row: kingRow, column: kingColumn }) => {
  const kingMovements = [];
  const kingCapturingMovements = [];

  const board = appState.game.status.value;

  const getDiagonalKingMovements = (
    { row, column },
    rowDirection,
    columnDirection
  ) => {
    const targetedRow = board[row];
    if (targetedRow) {
      const targetedColumn = targetedRow[column];
      if (targetedColumn === null) {
        kingMovements.push({
          tileRow: row,
          tileColumn: column,
        });

        getDiagonalKingMovements(
          { row: row + rowDirection, column: column + columnDirection },
          rowDirection,
          columnDirection
        );
      }
    }

    if (board[row]) {
      if (board[row][column]) {
        if (
          (board[row][column] === board[row][column]) !== null &&
          board[row][column] !==
            GAME_CONFIG.players[appState.game.turns.current]
              .checkerIdentifier &&
          board[row][column] !==
            GAME_CONFIG.players[appState.game.turns.current].kingIdentifier
        ) {
          const nextRow = board[row + rowDirection];
          if (nextRow) {
            const nextColumn = nextRow[column + columnDirection];
            if (nextColumn === null) {
              kingCapturingMovements.push({
                targetCell: {
                  row: row + rowDirection,
                  column: column + columnDirection,
                },
                eatenPiece: { row, column },
              });
            }
          }
        }
      }
    }

    return;
  };

  getDiagonalKingMovements({ row: kingRow + 1, column: kingColumn + 1 }, 1, 1);
  getDiagonalKingMovements({ row: kingRow + 1, column: kingColumn - 1 }, 1, -1);
  getDiagonalKingMovements(
    { row: kingRow - 1, column: kingColumn - 1 },
    -1,
    -1
  );
  getDiagonalKingMovements({ row: kingRow - 1, column: kingColumn + 1 }, -1, 1);

  const capture = {
    type: "capture",
    movements: kingCapturingMovements,
  };
  const movement = {
    type: "movement",
    movements: kingMovements,
  };

  return capture.movements.length > 0 ? capture : movement;
};

const getAvailableMovements = (tileRow, tileColumn) => {
  const isKing =
    appState.game.status.value[tileRow][tileColumn] ===
    GAME_CONFIG.players[appState.game.turns.current].kingIdentifier;

  const availableMovementsConfig = { row: tileRow, column: tileColumn };

  return isKing
    ? getKingAvailableMovements(availableMovementsConfig)
    : getPieceAvailableMovements(availableMovementsConfig);
};

const hasOwnPiece = ({ tile }) =>
  (appState.game.turns.current != null &&
    !!tile.querySelector(
      `.${GAME_CONFIG.players[appState.game.turns.current].checkerClass}`
    )) ||
  (appState.game.turns.current != null &&
    !!tile.querySelector(
      `.${GAME_CONFIG.players[appState.game.turns.current].kingClass}`
    ));

const onClickTileHandler = ({
  element: tile,
  position: {
    rowIndex: clickedTileRowIndex,
    cellIndex: clickedTileColumnIndex,
  },
}) => {
  resetAvailableMovementsHighlighting();

  const clickedOnOwnPiece = hasOwnPiece({ tile });

  if (clickedOnOwnPiece) {
    tile.classList.add(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
    clickedChecker = [clickedTileRowIndex, clickedTileColumnIndex];

    const { movements, type } = getAvailableMovements(
      clickedTileRowIndex,
      clickedTileColumnIndex
    );

    movementType = type;
    availableMovements = movements;

    const peerCapturingMovements = getPeersCapturingMovements(
      clickedTileRowIndex,
      clickedTileColumnIndex
    );

    if (type === "movement" && peerCapturingMovements.length > 0) {
      availableMovements = [];
    }

    renderAvailableMovements({
      availableMovements,
    });

    appState.game.status.isSelectingMovement = true;
  }

  if (!clickedOnOwnPiece && appState.game.status.isSelectingMovement) {
    const [boardElement] = document.getElementsByClassName(
      KNOWN_CSS_CLASSES.board
    );

    switch (movementType) {
      case "movement": {
        for (const {
          tileRow: availableMovementRow,
          tileColumn: availableMovementColumn,
        } of availableMovements) {
          const isAvailableMovement =
            availableMovementRow === clickedTileRowIndex &&
            availableMovementColumn === clickedTileColumnIndex;

          if (isAvailableMovement) {
            const [clickedCheckerRowIndex, clickedCheckerColumnIndex] =
              clickedChecker;

            const currentTurnPlayer = appState.game.turns.current;

            const piece = getNewPieceValue({
              currentTurnPlayer,
              clickedChecker: {
                clickedCheckerRowIndex,
                clickedCheckerColumnIndex,
              },
              destinationTile: {
                clickedTileRowIndex,
                clickedTileColumnIndex,
              },
            });

            executeMovement({
              targetTile: {
                clickedTileRowIndex,
                clickedTileColumnIndex,
                piece,
              },
              clickedChecker: {
                clickedCheckerRowIndex,
                clickedCheckerColumnIndex,
              },
            });

            renderRows({
              boardElement,
              boardMatrix: appState.game.status.value,
            });
            appState.game.status.isSelectingMovement = false;
            renderTurnSwap();
          }
        }
        break;
      }
      case "capture": {
        for (const {
          eatenPiece: { row: eatenPieceRow, column: eatenPieceColumn },
          targetCell: {
            row: availableMovementRow,
            column: availableMovementColumn,
          },
        } of availableMovements) {
          const currentTurnPlayer = appState.game.turns.current;

          const [clickedCheckerRowIndex, clickedCheckerColumnIndex] =
            clickedChecker;

          const getNewPieceValueConfig = {
            currentTurnPlayer,
            clickedChecker: {
              clickedCheckerRowIndex,
              clickedCheckerColumnIndex,
            },
            destinationTile: { clickedTileRowIndex, clickedTileColumnIndex },
          };

          const piece = getNewPieceValue(getNewPieceValueConfig);

          const isAvailableMovement =
            availableMovementRow === clickedTileRowIndex &&
            availableMovementColumn === clickedTileColumnIndex;

          if (isAvailableMovement) {
            executeCapture({
              availableMovement: {
                availableMovementRow,
                availableMovementColumn,
              },
              piece,
              clickedChecker: {
                clickedCheckerRowIndex,
                clickedCheckerColumnIndex,
              },
              eatenPiece: {
                eatenPieceRow,
                eatenPieceColumn,
              },
            });

            const currentOpponentPlayer =
              currentTurnPlayer === GAME_CONFIG.players.p1.id
                ? GAME_CONFIG.players.p2.id
                : GAME_CONFIG.players.p1.id;

            increaseScore({ currentOpponentPlayer });

            renderRows({
              boardElement,
              boardMatrix: appState.game.status.value,
            });
            appState.game.status.isSelectingMovement = false;

            const hasCurrentPlayerWon = isCurrentPlayerVictorious(
              currentOpponentPlayer
            );

            if (hasCurrentPlayerWon) {
              const { addGameToHistory } = useLocalStorageState();

              const date = new Date();

              const addGameToHistoryConfig = {
                result: `Victory`,
                date: date.toDateString(),
                dateValue: date,
                players: {
                  p1: {
                    P1Name: appState.game.players.p1.name,
                    P1Score: appState.game.players.p1.score,
                  },
                  p2: {
                    P2Name: appState.game.players.p2.name,
                    P2Score: appState.game.players.p2.score,
                  },
                },
              };

              addGameToHistory({ addGameToHistoryConfig });

              const { renderHistoryGames } = useHistoryModule();

              const { getGamesHistory } = useLocalStorageState();

              const historyGames = getGamesHistory();

              renderHistoryGames({ historyGames });
              window.location.reload();
            }
          }
        }
        break;
      }
      default:
        break;
    }
  }
};

const isGameTied = () => {
  const [P1Piece] = appState.game.status.value
    .map((boardRow, boardRowIndex) => {
      return boardRow
        .map((boardColumn, boardColumnIndex) =>
          boardColumn === GAME_CONFIG.players.p1.checkerIdentifier ||
          boardColumn === GAME_CONFIG.players.p1.kingIdentifier
            ? {
                row: boardRowIndex,
                column: boardColumnIndex,
                value: boardColumn,
              }
            : null
        )
        .filter((item) => item !== null);
    })
    .flat();

  const [P2Piece] = appState.game.status.value
    .map((boardRow, boardRowIndex) => {
      return boardRow
        .map((boardColumn, boardColumnIndex) =>
          boardColumn === GAME_CONFIG.players.p2.checkerIdentifier ||
          boardColumn === GAME_CONFIG.players.p2.kingIdentifier
            ? {
                row: boardRowIndex,
                column: boardColumnIndex,
                value: boardColumn,
              }
            : null
        )
        .filter((item) => item !== null);
    })
    .flat();

  const player1AvailableMovements = getPeersCapturingMovements(
    P1Piece.row,
    P1Piece.column,
    true,
    true
  ).filter((item) => item.movements.length > 0);

  const player2AvailableMovements = getPeersCapturingMovements(
    P2Piece.row,
    P2Piece.column,
    true,
    true
  ).filter((item) => item.movements.length > 0);

  const playersHaveAvailableMovements =
    player1AvailableMovements.length > 0 &&
    player2AvailableMovements.length > 0;

  if (playersHaveAvailableMovements) {
    return;
  }

  if (
    confirm(
      `Seems like you two are very good at this! The game reached a draw! 🤷‍♂️ fancy another one?`
    )
  ) {
    return true;
  }
  return false;
};

const renderRows = ({ boardElement, boardMatrix }) => {
  while (boardElement.firstChild) {
    boardElement.removeChild(boardElement.lastChild);
  }
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

  const whiteKingParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.kings.white,
    elementCssClass: KNOWN_CSS_CLASSES.whiteKing,
  };

  const whiteKingElement = getContentFromHTMLTemplate(whiteKingParams);

  const redKingParams = {
    templateId: KNOWN_HTML_TEMPLATE_IDS.board.kings.red,
    elementCssClass: KNOWN_CSS_CLASSES.redKing,
  };

  const redKingElement = getContentFromHTMLTemplate(redKingParams);

  boardMatrix.forEach((row, rowIndex) => {
    const clonedRow = rowElement.cloneNode(true);
    row.forEach((cell, cellIndex) => {
      const clonedTile = tileElement.cloneNode(true);
      clonedTile.id = generateTileId(rowIndex, cellIndex);
      clonedTile.onclick = () => {
        onClickTileHandler({
          element: clonedTile,
          position: {
            rowIndex,
            cellIndex,
          },
        });
      };
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
        case 10:
          const clonedWhiteKing = whiteKingElement.cloneNode(true);
          clonedTile.appendChild(clonedWhiteKing);
          clonedRow.appendChild(clonedTile);
          break;
        case 20:
          const clonedRedKing = redKingElement.cloneNode(true);
          clonedTile.appendChild(clonedRedKing);
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

  //! I left this fixed array on purpose to test drawed games due to the difficulty that a game actually ends with a draw

  const testBoard = [
    [null, null, null, null, null, null, 1, null],
    [null, 1, null, 1, null, null, null, 1],
    [1, null, 1, null, 1, null, 1, null],
    [null, 1, null, 1, null, 2, null, 1],
    [2, null, 1, null, 2, null, 2, null],
    [null, 2, null, 2, null, 2, null, 2],
    [2, null, 2, null, 2, null, 2, null],
    [null, null, null, null, null, null, null, null],
  ];

  return testBoard;
};

const renderScoreboard = () => {
  const gameScoreboard = document.querySelector(
    `.${KNOWN_CSS_CLASSES.scoreboard}`
  );
  gameScoreboard.classList.add(KNOWN_CSS_CLASSES.gameStatus.gameStarted);
};

const bootstrapApp = () => {
  appState.game.status.gameStatus = "awaitingStart";
  const startGameButton = document.getElementById(KNOWN_IDS.buttons.startGame);
  const loadGameButton = document.getElementById(KNOWN_IDS.buttons.loadGame);
  const saveGameButton = document.getElementById(KNOWN_IDS.buttons.saveGame);

  const filterByDateInput = document.getElementById(
    KNOWN_IDS.inputs.dateFilter
  );
  const filterByScoreInput = document.getElementById(
    KNOWN_IDS.inputs.scoreFilter
  );

  filterByDateInput.onchange = onChangeFilterHandler;
  filterByScoreInput.onchange = onChangeFilterHandler;

  startGameButton.focus();
  startGameButton.onclick = onStartGameButtonClickHandler;
  loadGameButton.onclick = onLoadGameButtonClickHandler;
  saveGameButton.onclick = onSaveGameButtonClickHandler;

  const modal = document.getElementById(KNOWN_IDS.historyModule.modal);

  const modalTriggerButtonElement = document.getElementById(
    KNOWN_IDS.historyModule.modalTrigger
  );

  const closeModalButtonElement = document.getElementsByClassName("close")[0];

  modalTriggerButtonElement.onclick = () => {
    modal.style.display = "block";
  };

  closeModalButtonElement.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = onModalCloseClickHandler;

  const [boardElement] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.board
  );

  const matrixGenerationParams = {
    dimension: GAME_CONFIG.board.dimension,
    checkersRows: GAME_CONFIG.board.checkersRows,
    players: GAME_CONFIG.players,
  };

  const initialBoardMatrix = getInitialBoardMatrix(matrixGenerationParams);

  renderRows({ boardElement, boardMatrix: initialBoardMatrix });

  const { renderHistoryGames } = useHistoryModule();

  const { getGamesHistory } = useLocalStorageState();

  const historyGames = getGamesHistory();

  renderHistoryGames({ historyGames });
};

const onLoadGameButtonClickHandler = () => {
  const {
    value,
    players: {
      p1: { score: P1Score, name: P1Name, checkersCounter: P1CheckersCounter },
      p2: { score: P2Score, name: P2Name, checkersCounter: P2CheckersCounter },
    },
    currentTurn,
  } = JSON.parse(localStorage.getItem("JAZ_savedGame"));

  appState.game.status.value = value;
  appState.game.players.p1.score = P1Score;
  appState.game.players.p1.name = P1Name;
  appState.game.players.p1.checkersCounter = P1CheckersCounter;
  appState.game.players.p2.score = P2Score;
  appState.game.players.p2.name = P2Name;
  appState.game.players.p2.checkersCounter = P2CheckersCounter;
  appState.game.turns.current = currentTurn;

  const [boardElement] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.board
  );

  renderRows({ boardElement, boardMatrix: appState.game.status.value });
  renderTurn({ isGameLoaded: true });

  const playerIds = [
    { playerId: GAME_CONFIG.players.p1.id },
    { playerId: GAME_CONFIG.players.p2.id },
  ];

  playerIds.forEach(renderPlayerName);

  alert("Game loaded successfully! 🤩");
};

const onSaveGameButtonClickHandler = () => {
  const { setSavedGame } = useLocalStorageState();

  const saveGameConfig = {
    value: appState.game.status.value,
    players: {
      p1: {
        score: appState.game.players.p1.score,
        name: appState.game.players.p1.name,
        checkersCounter: appState.game.players.p1.checkersCounter,
      },
      p2: {
        score: appState.game.players.p2.score,
        name: appState.game.players.p2.name,
        checkersCounter: appState.game.players.p2.checkersCounter,
      },
    },
    currentTurn: appState.game.turns.current,
  };

  setSavedGame({ saveGameConfig });
  alert("Game saved successfully! 💾");
};

const onStartGameButtonClickHandler = () => {
  const loadGameButton = document.getElementById(KNOWN_IDS.buttons.loadGame);
  loadGameButton.disabled = false;

  const saveGameButton = document.getElementById(KNOWN_IDS.buttons.saveGame);
  saveGameButton.disabled = false;

  const matrixGenerationParams = {
    dimension: GAME_CONFIG.board.dimension,
    checkersRows: GAME_CONFIG.board.checkersRows,
    players: GAME_CONFIG.players,
  };

  const initialBoardMatrix = getInitialBoardMatrix(matrixGenerationParams);

  appState.game.status.value = initialBoardMatrix;

  const [boardElement] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.board
  );

  renderRows({ boardElement, boardMatrix: initialBoardMatrix });

  renderScoreboard();

  const players = [
    { namePlaceholder: "Player 1", playerId: "p1", defaultName: "Rick 🧪" },
    { namePlaceholder: "Player 2", playerId: "p2", defaultName: "Morty 👦" },
  ];

  players.forEach(getAndAssignPlayerName);

  appState.game.status.gameStatus = "started";

  appState.game.turns.current = GAME_CONFIG.players.p1.id;

  appState.game.players.p1.checkersCounter = 12;
  appState.game.players.p2.checkersCounter = 12;
  appState.game.players.p1.score = 0;
  appState.game.players.p2.score = 0;

  renderTurn({ isGameLoaded: false });
};

const resetAvailableMovementsHighlighting = () => {
  const highlightedTiles = Array.from(
    document.getElementsByClassName(KNOWN_CSS_CLASSES.gameStatus.selectedTile)
  );

  for (const tile of highlightedTiles) {
    tile.classList.remove(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
  }
};

const getAndAssignPlayerName = ({ namePlaceholder, playerId, defaultName }) => {
  let playerName = null;
  let result;
  do {
    result = prompt(`Hey! ${namePlaceholder}! What's your name?`, defaultName);

    if (result) {
      playerName = result.trim();
    }
  } while (!result);

  appState.game.players[playerId].name =
    playerName.trim().length === 0 ? defaultName : playerName;

  renderPlayerName({ playerId });
};

const renderAvailableMovements = ({ availableMovements }) => {
  if (availableMovements) {
    for (const movement of availableMovements) {
      if (movement.eatenPiece) {
        const {
          targetCell: { row, column },
        } = movement;

        const tileID = generateTileId(row, column);
        const tile = document.getElementById(tileID);
        tile?.classList.add(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
      } else {
        if (movement.tileRow) {
          const { tileRow, tileColumn } = movement;
          const tileID = generateTileId(tileRow, tileColumn);
          const tile = document.getElementById(tileID);
          tile?.classList.add(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
        } else {
          const { row, column } = movement;
          const tileID = generateTileId(row, column);
          const tile = document.getElementById(tileID);
          tile?.classList.add(KNOWN_CSS_CLASSES.gameStatus.selectedTile);
        }
      }
    }
  }
};

const getNewPieceValue = ({
  currentTurnPlayer,
  clickedChecker: { clickedCheckerRowIndex, clickedCheckerColumnIndex },
  destinationTile: { clickedTileRowIndex },
}) => {
  const boardStatus = appState.game.status.value;

  const clickedCheckerCurrentValue =
    boardStatus[clickedCheckerRowIndex][clickedCheckerColumnIndex];

  const currentPlayerKingIdentifier =
    GAME_CONFIG.players[currentTurnPlayer].kingIdentifier;

  const isKingRow =
    clickedTileRowIndex === GAME_CONFIG.players[currentTurnPlayer].kingRow;

  const pieceWasAlreadyKing =
    boardStatus[clickedCheckerRowIndex][clickedCheckerColumnIndex] ===
    GAME_CONFIG.players[currentTurnPlayer].kingIdentifier;

  return isKingRow
    ? pieceWasAlreadyKing
      ? clickedCheckerCurrentValue
      : currentPlayerKingIdentifier
    : clickedCheckerCurrentValue;
};

const executeCapture = ({
  availableMovement: { availableMovementRow, availableMovementColumn },
  piece,
  clickedChecker: { clickedCheckerRowIndex, clickedCheckerColumnIndex },
  eatenPiece: { eatenPieceRow, eatenPieceColumn },
}) => {
  appState.game.status.value[availableMovementRow][availableMovementColumn] =
    piece;

  appState.game.status.value[clickedCheckerRowIndex][
    clickedCheckerColumnIndex
  ] = null;

  appState.game.status.value[eatenPieceRow][eatenPieceColumn] = null;
};

const executeMovement = ({
  targetTile: { clickedTileRowIndex, clickedTileColumnIndex, piece },
  clickedChecker: { clickedCheckerRowIndex, clickedCheckerColumnIndex },
}) => {
  appState.game.status.value[clickedTileRowIndex][clickedTileColumnIndex] =
    piece;

  appState.game.status.value[clickedCheckerRowIndex][
    clickedCheckerColumnIndex
  ] = null;
};

const containsRivalPiece = ({ tileValue }) => {
  return (
    tileValue !== null &&
    tileValue !==
      GAME_CONFIG.players[appState.game.turns.current].checkerIdentifier &&
    tileValue !==
      GAME_CONFIG.players[appState.game.turns.current].kingIdentifier
  );
};

const getAdjacentRivalPieces = ({ cornerTiles }) => {
  return cornerTiles.filter(({ tileRow, tileColumn }) => {
    const row = appState.game.status.value[tileRow];
    if (!row) {
      return false;
    }
    const tile = row[tileColumn];

    return containsRivalPiece({ tileValue: tile });
  });
};

const increaseScore = ({ currentOpponentPlayer }) => {
  appState.game.players[currentOpponentPlayer].checkersCounter--;

  const [score] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards[appState.game.turns.current].score
  );

  appState.game.players[appState.game.turns.current].score += 5;

  score.innerHTML = appState.game.players[appState.game.turns.current].score;
};

const isCurrentPlayerVictorious = (currentOpponentPlayer) => {
  if (appState.game.players[currentOpponentPlayer].checkersCounter === 0) {
    if (
      confirm(
        `Hooray! 🥳, ${
          appState.game.players[appState.game.turns.current].name
        } won the game! Fancy another one?`
      )
    ) {
      return true;
    }

    return false;
  }
};

const getPeersCapturingMovements = (
  row,
  column,
  includeOwnPiece = false,
  includeRegularMovements = false
) => {
  const clickedPieceValue = appState.game.status.value[row][column];

  if (clickedPieceValue === null) {
    return [];
  }

  const isPeerValue = (value) =>
    value === GAME_CONFIG.players[appState.game.turns.current].kingIdentifier ||
    value ===
      GAME_CONFIG.players[appState.game.turns.current].checkerIdentifier;

  const peers = appState.game.status.value
    .map((boardRow, boardRowIndex) => {
      const boardItems = boardRow
        .map((_, boardColumnIndex) => {
          const currentValue =
            appState.game.status.value[boardRowIndex][boardColumnIndex];

          const isSamePiece =
            boardRowIndex === row ? boardColumnIndex === column : false;

          const isPeer = isPeerValue(currentValue);

          if (includeOwnPiece) {
            return isPeer
              ? {
                  peerRow: boardRowIndex,
                  peerColumn: boardColumnIndex,
                  peerValue: currentValue,
                }
              : null;
          }

          return isPeer && !isSamePiece
            ? {
                peerRow: boardRowIndex,
                peerColumn: boardColumnIndex,
                peerValue: currentValue,
              }
            : null;
        })
        .filter((item) => item !== null);

      return boardItems;
    })
    .filter((item) => item.length > 0)
    .flat();

  const peerMovements = peers.map((peer) => {
    return peer.peerValue === GAME_CONFIG.players.p1.checkerIdentifier ||
      peer.peerValue === GAME_CONFIG.players.p2.checkerIdentifier
      ? getPieceAvailableMovements({
          row: peer.peerRow,
          column: peer.peerColumn,
        })
      : getKingAvailableMovements({
          row: peer.peerRow,
          column: peer.peerColumn,
        });
  });

  return includeRegularMovements
    ? peerMovements
    : peerMovements.filter((peerMovement) => peerMovement.type === "capture");
};

const renderTurn = ({ isGameLoaded = false }) => {
  const [scoreboard] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.scoreboard
  );

  const [player1Scoreboard, player2Scoreboard] =
    scoreboard.getElementsByClassName(
      KNOWN_CSS_CLASSES.playersScoreboards.both.scoreboard
    );

  const [P1Score] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.p1.score
  );

  P1Score.innerHTML = appState.game.players.p1.score;

  const [P2Score] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.p2.score
  );

  P2Score.innerHTML = appState.game.players.p2.score;

  const [p1Status] = player1Scoreboard.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.both.status
  );

  const [p2Status] = player2Scoreboard.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards.both.status
  );

  const {
    game: {
      turns: { waiting, activeTurn },
    },
  } = FIXTURE_TEXT;

  const isP1CurrentTurnOwner =
    appState.game.turns.current === GAME_CONFIG.players.p1.id;

  p1Status.innerText = activeTurn;
  p2Status.innerText = waiting;

  player1Scoreboard.classList.add(
    KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
  );
  player2Scoreboard.classList.remove(
    KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
  );

  if (isGameLoaded) {
    if (isP1CurrentTurnOwner) {
      player1Scoreboard.classList.add(
        KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
      );
      player2Scoreboard.classList.remove(
        KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
      );

      return;
    }

    player1Scoreboard.classList.remove(
      KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
    );
    player2Scoreboard.classList.add(
      KNOWN_CSS_CLASSES.gameStatus.playerTurnActive
    );

    p1Status.innerText = isP1CurrentTurnOwner ? activeTurn : waiting;
    p2Status.innerText = isP1CurrentTurnOwner ? waiting : activeTurn;

    return;
  }
};

const renderPlayerName = ({ playerId }) => {
  const [playerNameElement] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.playersScoreboards[playerId].name
  );

  playerNameElement.innerText = appState.game.players[playerId].name;
};

const onModalCloseClickHandler = (event) => {
  const modal = document.getElementById(KNOWN_IDS.historyModule.modal);
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

const onChangeFilterHandler = ({ target: { value: filterType } }) => {
  const { getGamesHistory } = useLocalStorageState();

  const {
    renderHistoryGames,
    sortByDate,
    sortByScore,
    renderResetHistoryGames,
  } = useHistoryModule();

  const historyGames = getGamesHistory();

  renderResetHistoryGames();

  if (filterType === "date") {
    const sortedGamesHistory = sortByDate({ historyGames });

    renderHistoryGames({
      historyGames: sortedGamesHistory,
    });

    return;
  }

  const sortedGamesHistory = sortByScore({ historyGames });

  renderHistoryGames({
    historyGames: sortedGamesHistory,
  });
};

window.onload = bootstrapApp(GAME_CONFIG);
