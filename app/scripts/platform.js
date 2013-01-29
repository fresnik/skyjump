/*global $ define */

define(function() {

  var Platform = function(rect) {
    this.rect = rect;
    this.rect.right = rect.x + rect.width;

    this.el = $('<div class="platform">');
    this.el.css({
      left: 0,
      top: 0,
      width: rect.width,
      height: rect.height
    });
  };

  Platform.defaultWidth = 50;
  Platform.defaultHeight = 10;

  Platform.prototype.onFrame = function(delta) {
    // Movement?
  };

  // Collision?

  return Platform;
});