/*global $ define */

define(function() {

  var Spring = function(pos) {
    this.pos = pos;
    this.dead = false;

    this.el = $('<div class="spring">');
    this.el.css({
      left: 0,
      top: 0
    });
  };

  Spring.prototype.begone = function() {
    this.el.remove();
    this.dead = true;
  };

  Spring.prototype.onFrame = function(delta) {
  };

  // Collision?

  return Spring;
});