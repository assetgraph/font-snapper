const fontSnapper = require('../lib/fontSnapper');
const normalizeFontWeight = require('../lib/normalizeFontWeight');
const normalizeFontStretch = require('../lib/normalizeFontStretch');
const { atRule, namedSyntax } = require('css-generators');
const { pickone, shape, array } = require('chance-generators');
const postcss = require('postcss');
const playwright = require('playwright');
const _ = require('lodash');

const expect = require('unexpected')
  .clone()
  .use(require('unexpected-check'));

const fontFamilyGenerator = pickone(['foo']);
const fontFaceDeclarationGenerator = atRule({ type: 'font-face' }).map(
  atRule => {
    const fontFaceDeclaration = {
      'font-family': fontFamilyGenerator
    };
    const ast = postcss.parse(atRule);
    for (const node of ast.nodes[0].nodes) {
      if (['font-weight', 'font-stretch', 'font-style'].includes(node.prop)) {
        fontFaceDeclaration[node.prop] = node.value;
      }
    }
    return fontFaceDeclaration;
  }
);

const computedStyleGenerator = shape({
  'font-family': fontFamilyGenerator,
  'font-style': namedSyntax('font-style'),
  'font-weight': namedSyntax('font-weight'),
  'font-stretch': namedSyntax('font-stretch')
});

const inputs = shape({
  fontFaceDeclarations: array(fontFaceDeclarationGenerator, { min: 2, max: 8 }),
  propsToSnap: computedStyleGenerator
});

function stringifyCssProps(props) {
  return Object.keys(props)
    .map(propertyName => `${propertyName}: ${props[propertyName]};`)
    .join('\n');
}

function indent(text, indentation = '  ') {
  return text.replace(/^/gm, indentation);
}

function stringifyFontFaceDeclaration(fontFaceDeclaration) {
  return `@font-face {\n${indent(stringifyCssProps(fontFaceDeclaration))}\n}`;
}

const browserPromiseByProduct = {};
async function getBrowser(product = 'chromium') {
  let browserPromise = browserPromiseByProduct[product];
  if (!browserPromise) {
    browserPromise = browserPromiseByProduct[product] = playwright[
      product
    ].launch();
    after(async function() {
      this.timeout(30000);
      await (await browserPromise).close();
    });
  }
  return browserPromise;
}

// Contains "foo":
const font = Buffer.from(
  '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',
  'base64'
);

const initialValueByProp = {
  'font-stretch': 'normal',
  'font-weight': 'normal',
  'font-style': 'normal'
};

function normalizeFontFaceDeclaration(fontFaceDeclaration) {
  const normalized = {};
  for (const propertyName of Object.keys(fontFaceDeclaration)) {
    let value = fontFaceDeclaration[propertyName];
    if (propertyName === 'font-stretch') {
      value = String(value)
        .split(/\s+/)
        .map(normalizeFontStretch)
        .join(' ');
    } else if (propertyName === 'font-weight') {
      value = String(value)
        .split(/\s+/)
        .map(normalizeFontWeight)
        .join(' ');
    }
    normalized[propertyName] = value;
  }
  return normalized;
}

function areFontFaceDeclarationsEquivalent(a, b) {
  return _.isEqual(
    normalizeFontFaceDeclaration({ ...initialValueByProp, ...a }),
    normalizeFontFaceDeclaration({ ...initialValueByProp, ...b })
  );
}

async function renderPage(html, product) {
  const browser = await getBrowser(product);
  const page = await browser.newPage();
  const loadedFonts = [];
  await page.route(/\.woff2$/, route => {
    const request = route.request();
    const url = request.url();
    loadedFonts.push(url);
    route.fulfill({
      status: 200,
      contentType: 'font/woff2',
      body: font
    });
  });

  await page.route('**/*', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: html
    });
  });

  await page.goto('https://example.com/');
  return loadedFonts;
}

describe('font-snapper', function() {
  it('should not crash on any valid input', function() {
    expect(
      ({ fontFaceDeclarations, propsToSnap }) => {
        fontSnapper(fontFaceDeclarations, propsToSnap);
      },
      'to be valid for all',
      inputs
    );
  });

  it('should snap to the same font as Chromium Headless', async function() {
    this.timeout(100000);
    await expect(
      async ({ fontFaceDeclarations, propsToSnap }) => {
        // Remove some features that font-snapper doesn't support yet:
        if (/lighter|bolder/.test(propsToSnap['font-weight'])) {
          propsToSnap['font-weight'] = '400';
        }
        // oblique with an angle is not supported yet: https://github.com/assetgraph/font-snapper/issues/7
        if (/oblique/.test(propsToSnap['font-style'])) {
          propsToSnap['font-style'] = 'italic';
        }
        for (const fontFaceDeclaration of fontFaceDeclarations) {
          if (/oblique/.test(fontFaceDeclaration['font-style'])) {
            fontFaceDeclaration['font-style'] = 'italic';
          }
          if (/\s+/.test(fontFaceDeclaration['font-weight'])) {
            // font-weight ranges are not supported yet: https://github.com/assetgraph/font-snapper/issues/9
            fontFaceDeclaration['font-weight'] = fontFaceDeclaration[
              'font-weight'
            ].split(/\s+/)[0];
          }

          if (/\s+/.test(fontFaceDeclaration['font-stretch'])) {
            fontFaceDeclaration['font-stretch'] = fontFaceDeclaration[
              'font-stretch'
            ].split(/\s+/)[0];
          }
        }

        // Remove duplicate @font-face declarations so there's always a correct choice:
        for (let i = 1; i < fontFaceDeclarations.length; i += 1) {
          const fontFaceDeclaration = fontFaceDeclarations[i];
          if (
            fontFaceDeclarations
              .slice(0, i)
              .some(prev =>
                areFontFaceDeclarationsEquivalent(prev, fontFaceDeclaration)
              )
          ) {
            fontFaceDeclarations.splice(i, 1);
            i -= 1;
          }
        }
        for (const [i, fontFaceDeclaration] of fontFaceDeclarations.entries()) {
          fontFaceDeclaration.i = i;
        }
        const snapped = fontSnapper(fontFaceDeclarations, propsToSnap);
        for (const [i, fontFaceDeclaration] of fontFaceDeclarations.entries()) {
          fontFaceDeclaration.src = `url(${
            fontFaceDeclaration.i === snapped.i ? 'correct' : `wrong${i}`
          }.woff2)`;
        }

        const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
${indent(
  fontFaceDeclarations.map(stringifyFontFaceDeclaration).join('\n\n'),
  '      '
)}

      body {
${indent(stringifyCssProps(propsToSnap), '        ')}
      }
    </style>
  </head>
  <body>foo</body>
</html>
`;
        const loadedFonts = await renderPage(html);
        // Sometimes Firefox downloads the wrong font also, tolerate that by only checking that the correct one gets downloaded first:
        expect(loadedFonts[0], 'to equal', 'https://example.com/correct.woff2');
      },
      'to be valid for all',
      inputs
    );
  });
});
