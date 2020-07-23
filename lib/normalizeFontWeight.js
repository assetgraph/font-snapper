const cssFontWeightNames = require('css-font-weight-names');

function normalizeFontWeight(value) {
  let parsedValue = value;
  if (typeof parsedValue === 'string') {
    // FIXME: Stripping the +bolder... suffix here will not always yield the correct result
    // when expanding animations and transitions
    parsedValue = parsedValue.replace(/\+.*$/, '').toLowerCase();
  }
  parsedValue = parseFloat(cssFontWeightNames[parsedValue] || parsedValue);
  if (parsedValue >= 1 && parsedValue <= 1000) {
    return parsedValue;
  } else {
    return value;
  }
}

module.exports = normalizeFontWeight;
