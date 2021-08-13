export const getContentFromHTMLTemplate = ({ templateId, elementCssClass }) => {
  const template = document.getElementById(templateId).content.cloneNode(true);
  return document
    .importNode(template, true)
    .querySelector(`.${elementCssClass}`);
};

export const generateTileId = (rowIndex, cellIndex) =>
  `row-${rowIndex}-tile-${cellIndex}`;
