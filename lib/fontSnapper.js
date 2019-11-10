// This implementation follows the font matching algorithm from https://www.w3.org/TR/css-fonts-3/#font-style-matching
const resolveFontWeight = require('./resolveFontWeight');
const parseFontFamily = require('font-family-papandreou').parse;
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

const normalizedInitialValueByProp = {
  'font-stretch': 'normal',
  'font-weight': 400,
  'font-style': 'normal'
};

const fontStretchValues = [
  'ultra-condensed',
  'extra-condensed',
  'condensed',
  'semi-condensed',
  'normal',
  'semi-expanded',
  'expanded',
  'extra-expanded',
  'ultra-expanded'
];

// font-style lookup order
const styleLookupOrder = {
  normal: ['normal', 'oblique', 'italic'],
  italic: ['italic', 'oblique', 'normal'],
  oblique: ['oblique', 'italic', 'normal']
};

function ascending(a, b) {
  return a - b;
}

// If the font-weight is given as a number or a single token, check for an exact match
// If given as a string with two values, it's interpreted as a range of supported values,
// as per https://www.w3.org/TR/css-fonts-4/#font-prop-desc
function matchesFontWeightRange(fontWeight, value) {
  value = normalizeFontWeight(value);
  let tokens;
  if (typeof fontWeight === 'number') {
    tokens = [fontWeight];
  } else {
    tokens = fontWeight.split(/\s+/).map(normalizeFontWeight);
  }
  if (tokens.length === 1) {
    return tokens[0] === value;
  } else if (tokens.length === 2) {
    return tokens[0] <= value && value <= tokens[1];
  } else {
    // Unsupported syntax
    return false;
  }
}

/**
 * @typedef {Object} FontFaceDeclaration
 * @property {String} font-family - CSS [font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family) property
 * @property {String} font-stretch - CSS [font-stretch](https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch) property
 * @property {String} font-weight - CSS [font-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight) property, must be normalized to numbers
 * @property {String} font-style - CSS [font-style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style) property
 */

/**
 * Font style matching algorithm as described in https://www.w3.org/TR/css-fonts-3/#fontstylematchingalg
 * @param  {FontFaceDeclaration[]} fontFaceDeclarations - Array of FontFaceDeclarations to match against
 * @param  {FontFaceDeclaration}   propsToSnap          - FontFaceDeclaration to match against fontFaceDeclarations
 *
 * @return {FontFaceDeclaration} The nearest match from fontFaceDeclarations
 */
function snapToAvailableFontProperties(fontFaceDeclarations, propsToSnap) {
  if (!Array.isArray(fontFaceDeclarations)) {
    throw new TypeError('fontFaceDeclarations must be an array');
  }
  if (
    typeof propsToSnap !== 'object' ||
    Array.isArray(propsToSnap) ||
    propsToSnap === null
  ) {
    throw new TypeError('propsToSnap must be an object');
  }

  // Fill in initial values for missing properties
  fontFaceDeclarations = fontFaceDeclarations.map(fontFaceDeclaration => ({
    ...normalizedInitialValueByProp,
    ...fontFaceDeclaration
  }));
  propsToSnap = { ...normalizedInitialValueByProp, ...propsToSnap };

  // System font, we can't know about the full properties. Early exit
  if (typeof propsToSnap['font-family'] === 'undefined') {
    return undefined;
  }

  // Match font-family first
  const fontFamilies = parseFontFamily(propsToSnap['font-family']);
  // Naively assume that the first defined font family is the one we are looking for. If it's a webfont it should be likely
  const familyMatches = fontFaceDeclarations.filter(
    fontFaceDeclaration =>
      fontFaceDeclaration['font-family'].toLowerCase() ===
      fontFamilies[0].toLowerCase()
  );

  // No match for font-family. Probably not a web font. Early exit
  if (familyMatches.length === 0) {
    return undefined;
  }

  // Find the best font-stretch
  const stretchStartIndex = fontStretchValues.indexOf(
    propsToSnap['font-stretch'].toLowerCase()
  );
  const stretchGroups = {};
  for (const familyMatch of familyMatches) {
    let [min, max] = familyMatch['font-stretch'].toLowerCase().split(/\s+/);
    max = max || min;
    const stretchStartIndex = fontStretchValues.indexOf(min);
    const stretchEndIndex = fontStretchValues.indexOf(max);
    if (!Number.isNaN(stretchStartIndex) && !Number.isNaN(stretchEndIndex)) {
      for (let i = stretchStartIndex; i <= stretchEndIndex; i += 1) {
        (stretchGroups[fontStretchValues[i]] =
          stretchGroups[fontStretchValues[i]] || []).push(familyMatch);
      }
    }
  }
  let firstHalf, lastHalf, stretchSearchOrder;
  let stretchMatches = [];

  if (stretchStartIndex <= fontStretchValues.indexOf('normal')) {
    // When value is 'normal' or lower, check denser values first, then less dense
    firstHalf = fontStretchValues.slice(0, stretchStartIndex + 1);
    lastHalf = fontStretchValues.slice(
      stretchStartIndex + 1 - fontStretchValues.length
    );

    stretchSearchOrder = [...firstHalf.reverse(), ...lastHalf];
  } else {
    // When value is less dense than 'normal', check expanded values first, then denser ones
    firstHalf = fontStretchValues.slice(
      stretchStartIndex - fontStretchValues.length
    );
    lastHalf = fontStretchValues.slice(0, stretchStartIndex);

    stretchSearchOrder = [...firstHalf, ...lastHalf.reverse()];
  }

  stretchSearchOrder.some(value => {
    if (stretchGroups[value]) {
      stretchMatches = stretchGroups[value];
      return true;
    }
  });

  let fontStyle = propsToSnap['font-style'].toLowerCase();
  // Don't break on oblique <angle>
  if (/^oblique\b/.test(fontStyle)) {
    fontStyle = 'oblique';
  }

  // Find the best font-style
  const styleMatches = styleLookupOrder[fontStyle]
    .map(style =>
      stretchMatches.filter(
        stretchMatch => stretchMatch['font-style'].toLowerCase() === style
      )
    )
    .find(list => list.length > 0);

  // Find the best font-weight
  const desiredWeight = propsToSnap['font-weight'];
  const availableFontWeights = styleMatches
    .map(m => normalizeFontWeight(m['font-weight']))
    .sort(ascending);

  const [value, ...operations] = String(desiredWeight).split('+');
  const startWeight = resolveFontWeight(
    normalizeFontWeight(value),
    availableFontWeights
  );

  // Non-standard syntax from Assetgraph font tooling:
  // '400+lighter+lighter'
  // '200+bolder+bolder'
  const resolvedWeight = operations.reduce((result, current) => {
    const indexModifier = current === 'lighter' ? -1 : +1;
    const nextIndex = availableFontWeights.indexOf(result) + indexModifier;

    return availableFontWeights[nextIndex] || result;
  }, startWeight);
  return styleMatches.find(styleMatch =>
    matchesFontWeightRange(styleMatch['font-weight'], resolvedWeight)
  );
}

module.exports = snapToAvailableFontProperties;
