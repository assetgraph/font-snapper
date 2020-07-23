// This implementation follows the font matching algorithm from https://www.w3.org/TR/css-fonts-3/#font-style-matching
const resolveFontWeight = require('./resolveFontWeight');
const normalizeFontWeight = require('./normalizeFontWeight');
const normalizeFontStretch = require('./normalizeFontStretch');
const parseFontFamily = require('font-family-papandreou').parse;

// Hack to treat oblique <angle> as oblique until we add proper support
function removeObliqueAngle(fontStyle) {
  if (/^oblique\b/.test(fontStyle)) {
    return 'oblique';
  } else {
    return fontStyle;
  }
}

const normalizedInitialValueByProp = {
  'font-stretch': 'normal',
  'font-weight': 400,
  'font-style': 'normal'
};

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

  const fontStretchRangeByFamilyMatch = new Map(
    familyMatches.map(familyMatch => {
      let [min, max] = familyMatch['font-stretch']
        .split(/\s+/)
        .map(normalizeFontStretch);
      max = max || min;
      return [familyMatch, { max, min }];
    })
  );

  const desiredFontStretchPercentage = normalizeFontStretch(
    propsToSnap['font-stretch']
  );

  // https://www.w3.org/TR/css-fonts-4/#font-style-matching
  // If the desired stretch value is less than or equal to 100%, stretch values below the desired stretch value are checked
  // in descending order followed by stretch values above the desired stretch value in ascending order until a match is found.
  // Otherwise, stretch values above the desired stretch value are checked in ascending order followed by stretch values
  // below the desired stretch value in descending order until a match is found.
  familyMatches.sort(
    (a, b) =>
      (desiredFontStretchPercentage <= 100 ? 1 : -1) *
      (fontStretchRangeByFamilyMatch.get(a).max -
        fontStretchRangeByFamilyMatch.get(b).max)
  );

  let bestDistance;
  let bestMatch;
  let stretchMatches = [];
  for (const familyMatch of familyMatches) {
    const { min, max } = fontStretchRangeByFamilyMatch.get(familyMatch);
    let distance;
    let distanceFrom;
    if (
      desiredFontStretchPercentage >= min &&
      desiredFontStretchPercentage <= max
    ) {
      // The desired font-stretch is in range of this @font-face declaration
      distanceFrom = desiredFontStretchPercentage;
      distance = 0;
    } else {
      // Not in range, figure out if the upper or lower bound is closest, then compute the distance
      const distanceFromMin = Math.abs(min - desiredFontStretchPercentage);
      const distanceFromMax = Math.abs(max - desiredFontStretchPercentage);
      if (distanceFromMin < distanceFromMax) {
        distance = distanceFromMin;
        distanceFrom = min;
      } else {
        distance = distanceFromMax;
        distanceFrom = max;
      }
    }
    if (bestDistance === undefined) {
      bestMatch = distanceFrom;
      stretchMatches = [familyMatch];
      bestDistance = distance;
    } else if (distance < bestDistance) {
      const alreadyHasHigherPriorityMatch =
        desiredFontStretchPercentage <= 100
          ? bestMatch <= desiredFontStretchPercentage &&
            distanceFrom > desiredFontStretchPercentage
          : bestMatch >= desiredFontStretchPercentage &&
            distanceFrom < desiredFontStretchPercentage;
      if (!alreadyHasHigherPriorityMatch) {
        bestMatch = distanceFrom;
        stretchMatches = [familyMatch];
        bestDistance = distance;
      }
    } else if (distance === 0 || (min <= bestMatch && bestMatch <= max)) {
      stretchMatches.push(familyMatch);
    }
  }

  // Don't break on oblique <angle>
  const fontStyle = removeObliqueAngle(propsToSnap['font-style'].toLowerCase());

  // Find the best font-style
  const styleMatches = styleLookupOrder[fontStyle]
    .map(style =>
      stretchMatches.filter(
        stretchMatch =>
          removeObliqueAngle(stretchMatch['font-style'].toLowerCase()) === style
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

  // Non-standard syntax from font-tracer tooling:
  // '400+lighter+lighter'
  // '200+bolder+bolder'
  const resolvedWeight = operations.reduce((result, current) => {
    const indexModifier = current === 'lighter' ? -1 : +1;
    const nextIndex = availableFontWeights.indexOf(result) + indexModifier;

    return availableFontWeights[nextIndex] || result;
  }, startWeight);
  return (
    styleMatches &&
    styleMatches.find(styleMatch =>
      matchesFontWeightRange(styleMatch['font-weight'], resolvedWeight)
    )
  );
}

module.exports = snapToAvailableFontProperties;
