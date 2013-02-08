/*global $ define */

define(['controls'], function(controls) {

  var PLAYER_SPEED = 300;
  var JUMP_VELOCITY = 1000;
  var GRAVITY = 2500;

  var transform = $.fx.cssPrefix + 'transform';

  var Player = function(el, game) {
    this.el = el;
    this.game = game;
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
  };

  Player.JUMP_DIST = 175;

  Player.prototype.onFrame = function(delta) {

    // Player input
    this.vel.x = controls.inputVec.x * PLAYER_SPEED;

    // DEVELOPER STUFF - TODO: BEGIN REMOVE
    if (controls.keys.c) {
      this.game.reset();
    }
    // END OF DEV STUFF, TODO: END REMOVE

    // Gravity
    this.vel.y += GRAVITY * delta;

    // Update state
    var oldY = this.pos.y;
    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;

    // Check collisions
    this.checkHorizontal();
    this.checkPlatforms(oldY);
    this.checkSprings(oldY);
    this.checkGameover();

    // Update player position
    this.el.css(transform, 'translate3d(' + this.pos.x + 'px,' + this.pos.y + 'px,0)');

    this.el.toggleClass('walking', this.vel.x !== 0);
    this.el.toggleClass('jumping', this.vel.y < 0);
    this.el.toggleClass('movingLeft', this.vel.x < 0);
    this.el.toggleClass('movingRight', this.vel.x > 0);
  };

  /**
   * Perform check if player has moved too far to the
   * left or the right, and perform wraparound if so.
   */
  Player.prototype.checkHorizontal = function() {
    if (this.pos.x < 0)
      this.pos.x = this.game.width;
    else
    if (this.pos.x > this.game.width)
      this.pos.x = 0;
  };

  /**
   * Check if player is touching a platform on the way down
   * @param {Number} oldY Last known vertical position of player
   */
  Player.prototype.checkPlatforms = function(oldY) {
    var pos = this.pos;
    var vel = this.vel;

    this.game.forEachPlatform( function(p) {
      // Are we crossing Y.
      if (p.rect.y >= oldY && p.rect.y < pos.y) {

        // Is our X within platform width, add extra invisible boundary
        if (pos.x > p.rect.x - 5 && pos.x < p.rect.right + 5) {

          // Collision. Let's jump!
          pos.y = p.rect.y;
          vel.y = -JUMP_VELOCITY;
        }
      }
    });
  };

  /**
   * Check if player is touching a spring on the way down
   * @param {Number} oldY Last known vertical position of player
   */
  Player.prototype.checkSprings = function(oldY) {
    var pos = this.pos;
    var vel = this.vel;

    this.game.forEachSpring( function(s) {
      // Are we crossing Y.
      if (pos.y > oldY && Math.abs(s.pos.y - pos.y) < 16) {

        // Is our X within spring width
        if (pos.x > s.pos.x - 16 && pos.x < s.pos.x + 16) {

          // Collision. Let's jump extra high!
          pos.y = s.pos.y;
          vel.y = -JUMP_VELOCITY*1.5;
        }
      }
    });
  };

  Player.prototype.checkGameover = function() {
    if (this.pos.y > this.game.viewport.y + this.game.height + 50) {
      this.game.gameover();
    }
  };

  Player.prototype.reset = function() {
    controls.reset();
    this.vel.y = 0;
  };

  return Player;
});