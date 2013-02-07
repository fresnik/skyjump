/*global define, $, asEvented */

define([], function() {

  var KEYS = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    67: 'c',
  };
  var FULL_ANGLE = 20;

  /**
   * Controls singleton class.
   * @constructor
   */
  var Controls = function() {
    this.inputVec = { x: 0, y: 0 };
    this.tilt = 0;

    this.spacePressed = false;
    this.keys = {};

    $(window)
      .on('keydown', this.onKeyDown.bind(this))
      .on('keyup', this.onKeyUp.bind(this))
      .on('deviceorientation', this.onOrientation.bind(this))
      .on('touchstart', this.onTouch.bind(this));
  };

  asEvented.call(Controls.prototype);

  Controls.prototype.onKeyDown = function(e) {
    if (e.keyCode in KEYS) {
      var key = KEYS[e.keyCode];
      this.keys[key] = true;
    }

    if (key === 'space') {
      this.trigger('touch');
    }
  };

  Controls.prototype.onKeyUp = function(e) {
    if (e.keyCode in KEYS) {
      this.keys[KEYS[e.keyCode]] = false;
    }
  };


  Controls.prototype.reset = function() {
    // Start with no key pressed
    for (var k in this.keys)
    {
      this.keys[k] = false;
    }
  };

  Controls.prototype.onTouch = function(e) {
    this.trigger('touch');
  };

  Controls.prototype.onOrientation = function(e) {
    var degree = e.gamma;

    if (window.orientation) {
      var dir = window.orientation / 90;
      degree = e.beta * dir;
    }

    var speed = degree / FULL_ANGLE;
    this.tilt = -Math.max(Math.min(speed, 1), -1);
    if (!navigator.userAgent.match(/android/i)) {
      this.tilt *= -1;
    }
  };

  Controls.prototype.onFrame = function() {
    if (this.keys.right) {
      this.inputVec.x = 1;
    } else if (this.keys.left) {
      this.inputVec.x = -1;
    } else {
      this.inputVec.x = 0;
    }

    if (this.inputVec.x === 0) {
      this.inputVec.x = this.tilt;
    }
  };

  // Export singleton.
  return new Controls();
});