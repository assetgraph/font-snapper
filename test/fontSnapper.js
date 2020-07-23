const expect = require('unexpected');

const snap = require('../lib/fontSnapper');

describe('fontSnapper', function() {
  it('should throw a type error when not passing a @font-face declarations array', function() {
    expect(
      function() {
        snap();
      },
      'to throw',
      new TypeError('fontFaceDeclarations must be an array')
    );
  });

  it('should throw a type error when not passing a font properties object', function() {
    expect(
      function() {
        snap([]);
      },
      'to throw',
      new TypeError('propsToSnap must be an object')
    );
  });

  it('should return undefined when no @font-face declarations are provided', function() {
    var snapped = snap([], {
      'font-family': 'Tahoma',
      'font-stretch': 'normal',
      'font-style': 'normal',
      'font-weight': '400'
    });

    expect(snapped, 'to be undefined');
  });

  it('should fill in missing font-stretch property', function() {
    var snapped = snap(
      [
        {
          'font-family': 'Tahoma',
          'font-stretch': 'normal',
          'font-style': 'normal',
          'font-weight': '400'
        }
      ],
      {
        'font-family': 'Tahoma',
        'font-style': 'normal',
        'font-weight': '400'
      }
    );

    expect(snapped, 'to satisfy', {
      'font-family': 'Tahoma',
      'font-stretch': 'normal',
      'font-style': 'normal',
      'font-weight': '400'
    });
  });

  it('should fill in missing font-style property', function() {
    var snapped = snap(
      [
        {
          'font-family': 'Tahoma',
          'font-stretch': 'normal',
          'font-style': 'normal',
          'font-weight': '400'
        }
      ],
      {
        'font-family': 'Tahoma',
        'font-stretch': 'normal',
        'font-weight': '400'
      }
    );

    expect(snapped, 'to satisfy', {
      'font-family': 'Tahoma',
      'font-stretch': 'normal',
      'font-style': 'normal',
      'font-weight': '400'
    });
  });

  it('should fill in missing font-weight property', function() {
    var snapped = snap(
      [
        {
          'font-family': 'Tahoma',
          'font-stretch': 'normal',
          'font-style': 'normal',
          'font-weight': '400'
        }
      ],
      {
        'font-family': 'Tahoma',
        'font-stretch': 'normal',
        'font-style': 'normal'
      }
    );

    expect(snapped, 'to satisfy', {
      'font-family': 'Tahoma',
      'font-stretch': 'normal',
      'font-style': 'normal',
      'font-weight': '400'
    });
  });

  describe('font-family', function() {
    it('should return an exact match', function() {
      var snapped = snap(
        [
          {
            'font-family': 'foo'
          }
        ],
        {
          'font-family': 'foo'
        }
      );

      expect(snapped, 'to satisfy', {
        'font-family': 'foo'
      });
    });

    it('should return a case insensitive match', function() {
      var snapped = snap(
        [
          {
            'font-family': 'Foo'
          }
        ],
        {
          'font-family': 'foO'
        }
      );

      expect(snapped, 'to satisfy', {
        'font-family': 'Foo'
      });
    });

    it('should unquote quoted values', function() {
      var snapped = snap(
        [
          {
            'font-family': 'foo font'
          }
        ],
        {
          'font-family': '"foo font"'
        }
      );

      expect(snapped, 'to satisfy', {
        'font-family': 'foo font'
      });
    });

    it('should match the first font in a multiple value assignment', function() {
      var snapped = snap(
        [
          {
            'font-family': 'foo'
          }
        ],
        {
          'font-family': 'foo, bar, baz'
        }
      );

      expect(snapped, 'to satisfy', {
        'font-family': 'foo'
      });
    });

    it('should not match the subsequent fonts in a multiple value assignment', function() {
      var snapped = snap(
        [
          {
            'font-family': 'foo'
          }
        ],
        {
          'font-family': 'bar, foo, baz'
        }
      );

      expect(snapped, 'to be undefined');
    });
  });

  describe('font-stretch', function() {
    it('should return an exact match', function() {
      var snapped = snap(
        [
          {
            'font-family': 'foo',
            'font-stretch': 'extra-condensed'
          },
          {
            'font-family': 'foo',
            'font-stretch': 'condensed'
          },
          {
            'font-family': 'foo',
            'font-stretch': 'normal'
          }
        ],
        {
          'font-family': 'foo',
          'font-stretch': 'condensed'
        }
      );

      expect(snapped, 'to satisfy', {
        'font-stretch': 'condensed'
      });
    });

    it('should return a case insensitive match', function() {
      var snapped = snap(
        [
          {
            'font-family': 'foo',
            'font-stretch': 'extra-condensed'
          },
          {
            'font-family': 'foo',
            'font-stretch': 'conDENSED'
          },
          {
            'font-family': 'foo',
            'font-stretch': 'normal'
          }
        ],
        {
          'font-family': 'foo',
          'font-stretch': 'CONdensed'
        }
      );

      expect(snapped, 'to satisfy', {
        'font-stretch': 'conDENSED'
      });
    });

    describe('when looking for `normal` stretch', function() {
      it('should snap to denser alternative when available', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-stretch': 'condensed'
            },
            {
              'font-family': 'foo',
              'font-stretch': 'expanded'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'normal'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'condensed'
        });
      });

      it('should snap to expanded alternative when no denser ones exist', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-stretch': 'semi-expanded'
            },
            {
              'font-family': 'foo',
              'font-stretch': 'expanded'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'normal'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'semi-expanded'
        });
      });
    });

    describe('when looking for `semi-condensed` stretch', function() {
      it('should snap to denser alternative when available', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-stretch': 'condensed'
            },
            {
              'font-family': 'foo',
              'font-stretch': 'expanded'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'semi-condensed'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'condensed'
        });
      });

      it('should snap to expanded alternative when no denser ones exist', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-stretch': 'semi-expanded'
            },
            {
              'font-family': 'foo',
              'font-stretch': 'expanded'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'semi-condensed'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'semi-expanded'
        });
      });
    });

    describe('when looking for `semi-expanded` stretch', function() {
      it('should snap to more expanded alternative when available', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-stretch': 'condensed'
            },
            {
              'font-family': 'foo',
              'font-stretch': 'expanded'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'semi-expanded'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'expanded'
        });
      });

      it('should snap to denser alternative when no more expanded ones exist', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-stretch': 'semi-condensed'
            },
            {
              'font-family': 'foo',
              'font-stretch': 'normal'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'semi-expanded'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'normal'
        });
      });
    });

    describe('with CSS Fonts 4 ranges', function() {
      it('should snap to an entry with a range that contains the desired value', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-stretch': 'ultra-condensed' },
            {
              'font-family': 'foo',
              'font-stretch': 'extra-condensed semi-condensed'
            },
            { 'font-family': 'foo', 'font-stretch': 'expanded' }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'condensed'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'extra-condensed semi-condensed'
        });
      });

      it('should prefer a range containing the value to a an inexact match within the range', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-stretch': 'extra-condensed' },
            {
              'font-family': 'foo',
              'font-stretch': 'ultra-condensed ultra-expanded'
            }
          ],
          {
            'font-family': 'foo',
            'font-stretch': 'condensed'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-stretch': 'ultra-condensed ultra-expanded'
        });
      });
    });
  });

  describe('font-style', function() {
    describe('when looking for italic', function() {
      it('should return an exact match', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            },
            {
              'font-family': 'foo',
              'font-style': 'italic'
            },
            {
              'font-family': 'foo',
              'font-style': 'oblique'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'italic'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'italic'
        });
      });

      it('should return a case insensitive match', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            },
            {
              'font-family': 'foo',
              'font-style': 'itaLIC'
            },
            {
              'font-family': 'foo',
              'font-style': 'oblique'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'ITAlic'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'itaLIC'
        });
      });

      it('should snap to oblique', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            },
            {
              'font-family': 'foo',
              'font-style': 'oblique'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'italic'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'oblique'
        });
      });

      it('should snap to normal', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'italic'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'normal'
        });
      });
    });

    describe('when looking for oblique', function() {
      it('should return an exact match', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            },
            {
              'font-family': 'foo',
              'font-style': 'italic'
            },
            {
              'font-family': 'foo',
              'font-style': 'oblique'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'oblique'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'oblique'
        });
      });

      it('should snap to italic', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            },
            {
              'font-family': 'foo',
              'font-style': 'italic'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'oblique'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'italic'
        });
      });

      it('should snap to normal', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'oblique'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'normal'
        });
      });
    });

    describe('when looking for normal', function() {
      it('should return an exact match', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'normal'
            },
            {
              'font-family': 'foo',
              'font-style': 'italic'
            },
            {
              'font-family': 'foo',
              'font-style': 'oblique'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'normal'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'normal'
        });
      });

      it('should snap to oblique', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'italic'
            },
            {
              'font-family': 'foo',
              'font-style': 'oblique'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'normal'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'oblique'
        });
      });

      it('should snap to italic', function() {
        var snapped = snap(
          [
            {
              'font-family': 'foo',
              'font-style': 'italic'
            }
          ],
          {
            'font-family': 'foo',
            'font-style': 'normal'
          }
        );

        expect(snapped, 'to satisfy', {
          'font-style': 'italic'
        });
      });
    });
  });

  describe('font-weight', function() {
    describe('relative font-weights', function() {
      it('should snap to the exact value', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '400' },
            { 'font-family': 'foo', 'font-weight': '500' },
            { 'font-family': 'foo', 'font-weight': '600' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '500'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '500' });
      });

      it('should snap to a case insensitive match', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': 'boLD' },
            { 'font-family': 'foo', 'font-weight': 'light' },
            { 'font-family': 'foo', 'font-weight': 'normal' }
          ],
          {
            'font-family': 'foo',
            'font-weight': 'BOld'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': 'boLD' });
      });

      it('should snap to the best available lighter value', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '100' },
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '500' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '300'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '200' });
      });

      it('should snap to the best available bolder value', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '500' },
            { 'font-family': 'foo', 'font-weight': '700' },
            { 'font-family': 'foo', 'font-weight': '800' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '600'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '700' });
      });

      it('should snap to the exact value plus 1 lighter', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '500' },
            { 'font-family': 'foo', 'font-weight': '700' },
            { 'font-family': 'foo', 'font-weight': '800' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '700+lighter'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '500' });
      });

      it('should snap to the exact value plus 2 lighter', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '500' },
            { 'font-family': 'foo', 'font-weight': '700' },
            { 'font-family': 'foo', 'font-weight': '800' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '800+lighter+lighter'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '500' });
      });

      it('should snap to the best available value plus 1 lighter', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '500' },
            { 'font-family': 'foo', 'font-weight': '700' },
            { 'font-family': 'foo', 'font-weight': '800' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '900+lighter'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '700' });
      });

      it('should snap to the best available value plus 2 lighter', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '500' },
            { 'font-family': 'foo', 'font-weight': '700' },
            { 'font-family': 'foo', 'font-weight': '800' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '900+lighter+lighter'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '500' });
      });

      it('should not snap to a lighter weight than what is available', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '300+lighter+lighter'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '200' });
      });

      it('should snap to the exact value plus 1 bolder', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '300+bolder'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '400' });
      });

      it('should snap to the exact value plus 2 bolder', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '200+bolder+bolder'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '400' });
      });

      it('should snap to best available value plus 1 bolder', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '100+bolder'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '300' });
      });

      it('should snap to best available value plus 2 bolder', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '100+bolder+bolder'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '400' });
      });

      it('should not snap to a bolder weight than what is available', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '300+bolder+bolder'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '400' });
      });

      it('should snap to the correct value given both lighter and bolder modifications', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '200' },
            { 'font-family': 'foo', 'font-weight': '300' },
            { 'font-family': 'foo', 'font-weight': '400' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '300+bolder+lighter'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '300' });
      });
    });

    describe('with CSS Fonts 4 ranges', function() {
      it('should snap to an entry with a range that contains the desired value', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '100' },
            { 'font-family': 'foo', 'font-weight': '200 400' },
            { 'font-family': 'foo', 'font-weight': '500' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '300'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '200 400' });
      });

      it('should prefer a range containing the value to a an inexact match within the range', function() {
        var snapped = snap(
          [
            { 'font-family': 'foo', 'font-weight': '100 800' },
            { 'font-family': 'foo', 'font-weight': '300' }
          ],
          {
            'font-family': 'foo',
            'font-weight': '400'
          }
        );

        expect(snapped, 'to satisfy', { 'font-weight': '100 800' });
      });
    });

    describe('with values that are not multiples of 100', function() {
      describe('without ranges', function() {
        it('should prefer an exact match', function() {
          const snapped = snap(
            [
              { 'font-family': 'foo', 'font-weight': '251' },
              { 'font-family': 'foo', 'font-weight': '252' },
              { 'font-family': 'foo', 'font-weight': '253' },
              { 'font-family': 'foo', 'font-weight': '254' }
            ],
            {
              'font-family': 'foo',
              'font-weight': '253'
            }
          );

          expect(snapped, 'to satisfy', { 'font-weight': '253' });
        });

        // If the desired weight is inclusively between 400 and 500, weights greater than
        // or equal to the target weight are checked in ascending order until 500 is hit
        // and checked, followed by weights less than the target weight in descending order,
        // followed by weights greater than 500, until a match is found.
        describe('when the desired weight is in the 400...500 range', function() {
          it('should prefer a higher value even though a closer match lower than the desired weight is available', function() {
            const snapped = snap(
              [
                { 'font-family': 'foo', 'font-weight': '401' },
                { 'font-family': 'foo', 'font-weight': '450' }
              ],
              {
                'font-family': 'foo',
                'font-weight': '402'
              }
            );

            expect(snapped, 'to satisfy', { 'font-weight': '450' });
          });

          it('should prefer a lower value less than 400 even though a closer match higher than 500 is available', function() {
            const snapped = snap(
              [
                { 'font-family': 'foo', 'font-weight': '501' },
                { 'font-family': 'foo', 'font-weight': '200' }
              ],
              {
                'font-family': 'foo',
                'font-weight': '499'
              }
            );

            expect(snapped, 'to satisfy', { 'font-weight': '200' });
          });
        });

        describe('when the desired weight is lower than 400', function() {
          it('should choose the closest match lower than the desired value', function() {
            const snapped = snap(
              [
                { 'font-family': 'foo', 'font-weight': '341' },
                { 'font-family': 'foo', 'font-weight': '343' },
                { 'font-family': 'foo', 'font-weight': '342' }
              ],
              {
                'font-family': 'foo',
                'font-weight': '344'
              }
            );

            expect(snapped, 'to satisfy', { 'font-weight': '343' });
          });

          it('should prefer a lower value even though a closer match higher than the desired weight is available', function() {
            const snapped = snap(
              [
                { 'font-family': 'foo', 'font-weight': '301' },
                { 'font-family': 'foo', 'font-weight': '350' }
              ],
              {
                'font-family': 'foo',
                'font-weight': '344'
              }
            );

            expect(snapped, 'to satisfy', { 'font-weight': '301' });
          });
        });

        describe('when the desired weight is higher than 500', function() {
          it('should choose the closest match higher than the desired value', function() {
            const snapped = snap(
              [
                { 'font-family': 'foo', 'font-weight': '557' },
                { 'font-family': 'foo', 'font-weight': '556' },
                { 'font-family': 'foo', 'font-weight': '558' }
              ],
              {
                'font-family': 'foo',
                'font-weight': '555'
              }
            );

            expect(snapped, 'to satisfy', { 'font-weight': '556' });
          });

          it('should prefer a higher value even though a closer match higher than the desired weight is available', function() {
            const snapped = snap(
              [
                { 'font-family': 'foo', 'font-weight': '557' },
                { 'font-family': 'foo', 'font-weight': '599' }
              ],
              {
                'font-family': 'foo',
                'font-weight': '558'
              }
            );

            expect(snapped, 'to satisfy', { 'font-weight': '599' });
          });
        });
      });
    });
  });

  // Regression test
  it('should not break when propsToSnap contains font-style: oblique <angle>', function() {
    var snapped = snap(
      [
        {
          'font-stretch': 'normal',
          'font-weight': '400',
          'font-style': 'normal',
          'font-family': 'IBM Plex Sans'
        }
      ],
      {
        'font-stretch': 'normal',
        'font-weight': 'bold',
        'font-style': 'oblique -132.5434grad',
        'font-family': '"IBM Plex Sans"'
      }
    );

    expect(snapped, 'to satisfy', {
      'font-family': 'IBM Plex Sans',
      'font-stretch': 'normal',
      'font-style': 'normal',
      'font-weight': '400'
    });
  });

  it('should not break when one of the font face declarations contains font-style: oblique <angle>', function() {
    const snapped = snap(
      [
        {
          'font-family': 'bar',
          'font-style': 'oblique 664.8853turn',
          'font-weight': 'normal',
          'font-stretch': 'ultra-condensed'
        }
      ],
      {
        'font-family': 'bar',
        'font-style': 'oblique',
        'font-weight': 'normal',
        'font-stretch': 'condensed'
      }
    );
    expect(snapped, 'to equal', {
      'font-stretch': 'ultra-condensed',
      'font-weight': 'normal',
      'font-style': 'oblique 664.8853turn',
      'font-family': 'bar'
    });
  });

  describe('with font-stretch given as a percentage', function() {
    it('should not break', function() {
      const snapped = snap(
        [
          {
            'font-family': 'foo',
            'font-style': 'normal',
            'font-weight': 'normal',
            'font-stretch': '50%'
          }
        ],
        {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '50%'
        }
      );
      expect(snapped, 'to equal', {
        'font-family': 'foo',
        'font-style': 'normal',
        'font-weight': 'normal',
        'font-stretch': '50%'
      });
    });

    describe('with the available font-stretch values given as the symbolic names', function() {
      const availableFontFaces = [
        'ultra-condensed',
        'extra-condensed',
        'condensed',
        'semi-condensed',
        'normal',
        'semi-expanded',
        'expanded',
        'extra-expanded',
        'ultra-expanded'
      ].map(fontStretchValue => ({
        'font-family': 'foo',
        'font-style': 'normal',
        'font-weight': 'normal',
        'font-stretch': fontStretchValue
      }));

      it('should map an unavailable percentage > 100% to the closest available match, checking the higher values first', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '137.5%'
        });
        expect(snapped['font-stretch'], 'to equal', 'extra-expanded');
      });

      it('should map an unavailable percentage < 100% to the closest available match, checking the lower values first', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '68.75%'
        });
        expect(snapped['font-stretch'], 'to equal', 'extra-condensed');
      });

      it('should map 50% to ultra-condensed', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '50%'
        });
        expect(snapped['font-stretch'], 'to equal', 'ultra-condensed');
      });

      it('should map 62.5% to extra-condensed', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '62.5%'
        });
        expect(snapped['font-stretch'], 'to equal', 'extra-condensed');
      });

      it('should map to 75% to condensed', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '75%'
        });
        expect(snapped['font-stretch'], 'to equal', 'condensed');
      });

      it('should map 87.5% to semi-condensed', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '87.5%'
        });
        expect(snapped['font-stretch'], 'to equal', 'semi-condensed');
      });

      it('should map 100% to normal', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '100%'
        });
        expect(snapped['font-stretch'], 'to equal', 'normal');
      });

      it('should map 112.5% to semi-expanded', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '112.5%'
        });
        expect(snapped['font-stretch'], 'to equal', 'semi-expanded');
      });

      it('should map 125% to expanded', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '125%'
        });
        expect(snapped['font-stretch'], 'to equal', 'expanded');
      });

      it('should map 150% to extra-expanded', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '150%'
        });
        expect(snapped['font-stretch'], 'to equal', 'extra-expanded');
      });

      it('should map 200% to ultra-expanded', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': '200%'
        });
        expect(snapped['font-stretch'], 'to equal', 'ultra-expanded');
      });
    });

    describe('with the available font-stretch values given as percentages', function() {
      const availableFontFaces = [
        '50%',
        '62.5%',
        '75%',
        '87.5%',
        '100%',
        '112.5%',
        '125%',
        '150%',
        '200%'
      ].map(fontStretchValue => ({
        'font-family': 'foo',
        'font-style': 'normal',
        'font-weight': 'normal',
        'font-stretch': fontStretchValue
      }));

      it('should map to ultra-condensed to 50%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'ultra-condensed'
        });
        expect(snapped['font-stretch'], 'to equal', '50%');
      });

      it('should map to extra-condensed to 62.5%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'extra-condensed'
        });
        expect(snapped['font-stretch'], 'to equal', '62.5%');
      });

      it('should map to condensed to 75%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'condensed'
        });
        expect(snapped['font-stretch'], 'to equal', '75%');
      });

      it('should map to semi-condensed to 87.5%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'semi-condensed'
        });
        expect(snapped['font-stretch'], 'to equal', '87.5%');
      });

      it('should map to normal to 100%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'normal'
        });
        expect(snapped['font-stretch'], 'to equal', '100%');
      });

      it('should map to semi-expanded to 112.5%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'semi-expanded'
        });
        expect(snapped['font-stretch'], 'to equal', '112.5%');
      });

      it('should map to expanded to 125%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'expanded'
        });
        expect(snapped['font-stretch'], 'to equal', '125%');
      });

      it('should map to extra-expanded to 150%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'extra-expanded'
        });
        expect(snapped['font-stretch'], 'to equal', '150%');
      });

      it('should map to ultra-expanded to 200%', function() {
        const snapped = snap(availableFontFaces, {
          'font-family': 'foo',
          'font-style': 'normal',
          'font-weight': 'normal',
          'font-stretch': 'ultra-expanded'
        });
        expect(snapped['font-stretch'], 'to equal', '200%');
      });
    });
  });

  // Regression test for a case found by https://github.com/assetgraph/font-snapper/pull/5
  it('should prefer a worse font-stretch % match below a desired value <= 100', function() {
    const snapped = snap(
      [
        { 'font-family': 'foo' },
        {
          'font-family': 'foo',
          'font-style': 'italic',
          'font-stretch': '41%'
        }
      ],
      {
        'font-family': 'foo',
        'font-style': 'italic',
        'font-weight': 'normal',
        'font-stretch': 'condensed'
      }
    );

    expect(snapped, 'to satisfy', {
      'font-family': 'foo',
      'font-stretch': '41%',
      'font-style': 'italic',
      'font-weight': 400
    });
  });

  it('should prefer a worse font-stretch % match above a desired value > 100', function() {
    const snapped = snap(
      [
        { 'font-family': 'foo' },
        {
          'font-family': 'foo',
          'font-style': 'italic',
          'font-stretch': '180%'
        }
      ],
      {
        'font-family': 'foo',
        'font-style': 'italic',
        'font-weight': 'normal',
        'font-stretch': 'semi-expanded'
      }
    );

    expect(snapped, 'to satisfy', {
      'font-family': 'foo',
      'font-stretch': '180%',
      'font-style': 'italic',
      'font-weight': 400
    });
  });
});
