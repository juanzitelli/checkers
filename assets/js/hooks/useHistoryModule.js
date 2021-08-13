import { getContentFromHTMLTemplate } from "../utilities/dom.utilities.js";
import {
  KNOWN_CSS_CLASSES,
  KNOWN_HTML_TEMPLATE_IDS,
} from "../utilities/fixtures.utilities.js";

const useHistoryModule = () => {
  const [historyModuleContainer] = document.getElementsByClassName(
    KNOWN_CSS_CLASSES.historyModule.historyModuleContainer
  );
  const renderHistoryGames = ({ historyGames }) => {
    if (!historyGames || historyGames.length === 0) {
      const noGamesAvailableElement = document.createElement("p");
      noGamesAvailableElement.textContent =
        "Looks like there are no available games to display here!";
      historyModuleContainer.appendChild(noGamesAvailableElement);

      return;
    }

    for (const {
      result,
      date,
      players: {
        p1: { P1Name, P1Score },
        p2: { P2Name, P2Score },
      },
    } of historyGames) {
      const historyGameParams = {
        templateId: KNOWN_HTML_TEMPLATE_IDS.board.historyModule.historyGame,
        elementCssClass: KNOWN_CSS_CLASSES.historyModule.historyGame,
      };

      const historyGameElement = getContentFromHTMLTemplate(historyGameParams);

      const clonedHistoryGame = historyGameElement.cloneNode(true);

      const historyGameResultItem = clonedHistoryGame.querySelector(
        `.${KNOWN_CSS_CLASSES.historyModule.result}`
      );

      historyGameResultItem.textContent = `This game ended on a ${result} and was played on ${date}.`;

      const historyGamePlayersItem = clonedHistoryGame.querySelector(
        `.${KNOWN_CSS_CLASSES.historyModule.players}`
      );

      historyGamePlayersItem.textContent = `${P1Name} scored ${P1Score} points and ${P2Name} scored ${P2Score} points`;

      historyModuleContainer.appendChild(clonedHistoryGame);
    }
  };

  const sortByDate = ({ historyGames }) =>
    historyGames.sort((firstGame, secondGame) => {
      return firstGame.dateValue > secondGame.dateValue;
    });

  const sortByScore = ({ historyGames }) =>
    historyGames.sort((firstGame, secondGame) => {
      return +firstGame.players.p1.P1Score + +firstGame.players.p2.P2Score >
        +secondGame.players.p1.P1Score + +secondGame.players.p2.P2Score
        ? -1
        : 1;
    });

  const renderResetHistoryGames = () => {
    while (historyModuleContainer.lastChild) {
      historyModuleContainer.removeChild(historyModuleContainer.lastChild);
    }
  };

  return {
    renderHistoryGames,
    renderResetHistoryGames,
    sortByDate,
    sortByScore,
  };
};

export default useHistoryModule;
