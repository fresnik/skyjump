/*global define, $ */

define([], function() {

  var KEYS = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  /**
   * Controls singleton class.
   * @constructor
   */
  var Controls = function() {
    this.spacePressed = false;
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

  // Export singleton.
  return new Controls();
});