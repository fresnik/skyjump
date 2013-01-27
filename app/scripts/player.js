/*global $ define */

define(['controls'], function(controls) {

  var PLAYER_SPEED = 300;
  var JUMP_VELOCITY = 1000;
  var GRAVITY = 2500;
  var EDGE_OF_LIFE;

  var transform = $.fx.cssPrefix + 'transform';

  var Player = function(el, game) {
    this.el = el;
    this.game = game;
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.EDGE_OF_LIFE = game.height + 2*el.height();
  };

  Player.prototype.onFrame = function(delta) {

    // Player input
    if (controls.keys.right) {
      this.vel.x = PLAYER_SPEED;
    } else if (controls.keys.left) {
      this.vel.x = -PLAYER_SPEED;
    } else {
      this.vel.x = 0;
    }

    // Jump
    if (controls.keys.space && this.vel.y === 0) {
      this.vel.y = -JUMP_VELOCITY;
    }

    // Gravity
    this.vel.y += GRAVITY * delta;

    // Update state
    var oldY = this.pos.y;
    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;

    // Check collisions
    this.checkHorizontal();
    this.checkPlatforms(oldY);
    this.checkGameover();

    // Update UI.
    this.el.css(transform, 'translate(' + this.pos.x + 'px,' + this.pos.y + 'px)');

    this.el.toggleClass('walking', this.vel.x !== 0);
    this.el.toggleClass('jumping', this.vel.y < 0);
  };

  Player.prototype.checkHorizontal = function() {
    if (this.pos.x < 0)
      this.pos.x = this.game.width;
    else
    if (this.pos.x > this.game.width)
      this.pos.x = 0;
  };

  Player.prototype.checkPlatforms = function(oldY) {
    var platforms = this.game.platforms;
    for (var i = 0, p; p = platforms[i]; i++) {
      // Are we crossing Y.
      if (p.rect.y >= oldY && p.rect.y < this.pos.y) {

        // Is our X within platform width
        if (this.pos.x > p.rect.x && this.pos.x < p.rect.right) {

          // Collision. Let's jump!
          this.pos.y = p.rect.y;
          this.vel.y = -JUMP_VELOCITY;
        }
      }
    }
  };

  Player.prototype.checkGameover = function() {
    if (this.pos.y > this.EDGE_OF_LIFE) {
      this.game.gameover();
    }
  };

  Player.prototype.reset = function() {
    controls.reset();
  };

  return Player;
});