/*global define, $ */

define([], function() {

  var KEYS = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    67: 'c',
    73: 'i',
  };

  /**
   * Controls singleton class.
   * @constructor
   */
  var Controls = function() {
    this.keys = {};

    $(window)
      .on('keydown', this.onKeyDown.bind(this))
      .on('keyup', this.onKeyUp.bind(this));
  };

  Controls.prototype.onKeyDown = function(e) {
    if (e.keyCode in KEYS) {
      this.keys[KEYS[e.keyCode]] = true;
    }
  };

  Controls.prototype.onKeyUp = function(e) {
    if (e.keyCode in KEYS) {
      this.keys[KEYS[e.keyCode]] = false;
    }
  };

  Controls.prototype.reset = function() {
    // Start with no key pressed
    for (k in this.keys)
    {
      this.keys[k] = false;
    };
  };

  // Export singleton.
  return new Controls();
});