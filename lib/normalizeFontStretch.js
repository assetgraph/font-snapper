const percentageByFontStretchValue = {
  'ultra-condensed': 50,
  'extra-condensed': 62.5,
  condensed: 75,
  'semi-condensed': 87.5,
  normal: 100,
  'semi-expanded': 112.5,
  expanded: 125,
  'extra-expanded': 150,
  'ultra-expanded': 200
};

function normalizeFontStretch(fontStretchValue) {
  if (typeof fontStretchValue === 'string') {
    let percentage =
      percentageByFontStretchValue[fontStretchValue.toLowerCase()];
    if (percentage !== undefined) {
      return percentage;
    }
    const matchPercentage = fontStretchValue.match(/^([\d.]+)%$/);
    if (matchPercentage) {
      percentage = parseFloat(matchPercentage[1]);
      if (!isNaN(percentage)) {
        return percentage;
      }
    }
  } else if (typeof fontStretchValue === 'number') {
    return fontStretchValue;
  }

  return 100; // Assume "normal"
}

module.exports = normalizeFontStretch;
