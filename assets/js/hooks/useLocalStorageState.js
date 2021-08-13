const useLocalStorageState = () => {
  const savedGamesLocalStorageKey = "JAZ_savedGame";
  const historyGamesLocalStorageKey = "JAZ_history";

  const setSavedGame = ({ saveGameConfig }) => {
    localStorage.setItem(
      savedGamesLocalStorageKey,
      JSON.stringify(saveGameConfig)
    );
  };

  const getSavedGame = () => {
    return JSON.parse(localStorage.getItem(savedGamesLocalStorageKey));
  };

  const getGamesHistory = () => {
    return JSON.parse(localStorage.getItem(historyGamesLocalStorageKey));
  };

  const addGameToHistory = ({ addGameToHistoryConfig }) => {
    const previouslyExistingGames = getGamesHistory() ?? [];

    const gamesToBeAdded = [addGameToHistoryConfig, ...previouslyExistingGames];

    localStorage.setItem(
      historyGamesLocalStorageKey,
      JSON.stringify(gamesToBeAdded)
    );
  };

  return {
    setSavedGame,
    getSavedGame,
    addGameToHistory,
    getGamesHistory,
  };
};

export default useLocalStorageState;
