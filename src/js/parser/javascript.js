import Q from 'q';
import Snap from 'snapsvg';
import _ from 'lodash';

import javascript from './javascript/parser.js';

const svgContainerBase = `<div class="svg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:cc="http://creativecommons.org/ns#"
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
          version="1.1">
          <defs>
            <style type="text/css">svg {
  background-color: #fff;
}

text, tspan {
  font: 12px Arial;
}

path {
  fill-opacity: 0;
  stroke-width: 2px;
  stroke: #000;
}

circle {
  fill: #6b6659;
  stroke-width: 2px;
  stroke: #000;
}

.anchor text, .any-character text {
  fill: #fff;
}

.anchor rect, .any-character rect {
  fill: #6b6659;
}

.escape text, .charset-escape text, .literal text {
  fill: #000;
}

.escape rect, .charset-escape rect {
  fill: #bada55;
}

.literal rect {
  fill: #dae9e5;
}

.charset .charset-box {
  fill: #cbcbba;
}

.subexp .subexp-label,
.charset .charset-label,
.match-fragment .repeat-label {
  font-size: 10px;
}

.subexp .subexp-label,
.charset .charset-label {
  dominant-baseline: text-after-edge;
}

.subexp .subexp-box {
  stroke: #908c82;
  stroke-dasharray: 6,2;
  stroke-width: 2px;
  fill-opacity: 0;
}

.quote {
  fill: #908c82;
}

/*# sourceMappingURL=svg.css.map */
</style>
          </defs>
          <metadata>
            <rdf:RDF>
              <cc:License rdf:about="http://creativecommons.org/licenses/by/3.0/">
                <cc:permits rdf:resource="http://creativecommons.org/ns#Reproduction" />
                <cc:permits rdf:resource="http://creativecommons.org/ns#Distribution" />
                <cc:requires rdf:resource="http://creativecommons.org/ns#Notice" />
                <cc:requires rdf:resource="http://creativecommons.org/ns#Attribution" />
                <cc:permits rdf:resource="http://creativecommons.org/ns#DerivativeWorks" />
              </cc:License>
            </rdf:RDF>
          </metadata>
        </svg>
      </div>
      <div class="progress">
        <div style="width:0;"></div>
      </div>`;

export default class Parser {
  constructor(container, options) {
    this.state = {
      groupCounter: 1,
      renderCounter: 0,
      maxCounter: 0,
      cancelRender: false,
      warnings: []
    };

    this.options = options || {};
    _.defaults(this.options, {
      keepContent: false
    });

    this.container = container;
  }

  set container(cont) {
    this._container = cont;
    this._container.innerHTML = [
      svgContainerBase,
      this.options.keepContent ? this.container.innerHTML : ''
    ].join('');
    this._addClass('svg-container');
  }

  get container() {
    return this._container;
  }

  _addClass(className) {
    this.container.className = _(this.container.className.split(' '))
      .union([className])
      .value()
      .join(' ');
  }

  _removeClass(className) {
    this.container.className = _(this.container.className.split(' '))
      .without(className)
      .value()
      .join(' ');
  }

  parse(expression) {
    var deferred = Q.defer();

    this._addClass('loading');

    setTimeout(() => {
      try {
        javascript.Parser.SyntaxNode.state = this.state;

        this.parsed = javascript.parse(expression.replace(/\n/g, '\\n'));
        deferred.resolve(this);
      }
      catch(e) {
        deferred.reject(e);
      }
    });

    return deferred.promise;
  }

  render() {
    var svg = Snap(this.container.querySelector('svg')),
        progress = this.container.querySelector('.progress div');

    return this.parsed.render(svg.group())
      .then(
        result => {
          var box = result.getBBox();

          result.transform(Snap.matrix()
            .translate(10 - box.x, 10 - box.y));
          svg.attr({
            width: box.width + 20,
            height: box.height + 20
          });
        },
        null,
        percent => {
          progress.style.width = percent * 100 + '%';
        }
      )
      .finally(() => {
        this._removeClass('loading');
        this.container.removeChild(this.container.querySelector('.progress'));
      });
  }

  cancel() {
    this.state.cancelRender = true;
  }

  get warnings() {
    return this.state.warnings;
  }
}
