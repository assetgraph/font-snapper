const fontSnapper = require('../lib/fontSnapper');
const { namedSyntax } = require('css-generators');
const { pickone, shape, array } = require('chance-generators');

const expect = require('unexpected')
  .clone()
  .use(require('unexpected-check'));

const fontFaceDeclarationGenerator = shape({
  'font-family': pickone(['foo', 'bar']),
  'font-style': namedSyntax('font-style'),
  'font-weight': namedSyntax('font-weight'),
  'font-stretch': namedSyntax('font-stretch')
});

const inputs = shape({
  fontFaceDeclarations: array(fontFaceDeclarationGenerator, { max: 8 }),
  propsToSnap: fontFaceDeclarationGenerator
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
