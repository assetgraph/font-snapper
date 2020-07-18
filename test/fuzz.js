const fontSnapper = require('../lib/fontSnapper');
const { atRule, namedSyntax } = require('css-generators');
const { pickone, shape, array } = require('chance-generators');
const postcss = require('postcss');

const expect = require('unexpected')
  .clone()
  .use(require('unexpected-check'));

const fontFamilyGenerator = pickone(['foo', 'bar']);
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
  fontFaceDeclarations: array(fontFaceDeclarationGenerator, { max: 8 }),
  propsToSnap: computedStyleGenerator
});

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
});
