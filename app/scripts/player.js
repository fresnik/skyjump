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

    // Let the "death" line be just below the game screen
    // so the player is out of sight before TOD is announced
    this.EDGE_OF_LIFE = game.height + 1.5*el.height();
    this.WORLD_SCROLL_HEIGHT = game.height / 2;
  };

  Player.JUMP_DIST = 175;

  Player.prototype.onFrame = function(delta) {

    // Player input
    if (controls.keys.right) {
      this.vel.x = PLAYER_SPEED;
    } else if (controls.keys.left) {
      this.vel.x = -PLAYER_SPEED;
    } else {
      this.vel.x = 0;
    }

    // DEVELOPER STUFF - TODO: BEGIN REMOVE
    if (controls.keys.c) {
      this.game.reset();
    }
    if ((controls.keys.space) && (this.vel.y === 0)) {
      this.vel.y = -JUMP_VELOCITY;
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
    this.checkVertical(oldY);
    this.checkPlatforms(oldY);
    this.checkGameover();

    // Update player position
    this.el.css(transform, 'translate(' + this.pos.x + 'px,' + this.pos.y + 'px)');

    // Update platform positions
    // TODO: Optimize, do not do translate unless platform positions are changing
    this.game.forEachPlatform( function(p) {
      p.el.css(transform, 'translate(' + p.rect.x + 'px,' + p.rect.y + 'px)');
    });

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
   * Check if player has moved high enough to scroll the world
   * @param  {number} oldY Last known vertical position of player
   */
  Player.prototype.checkVertical = function(oldY) {
    if (this.pos.y <= this.WORLD_SCROLL_HEIGHT) {

      var dY = this.pos.y - this.WORLD_SCROLL_HEIGHT;
      this.pos.y = this.WORLD_SCROLL_HEIGHT;
      this.game.scrollWorld( dY );
    }
  };

  /**
   * Check if player is touching a platform on the way down
   * @param  {number} oldY Last known vertical position of player
   */
  Player.prototype.checkPlatforms = function(oldY) {
    var pos = this.pos;
    var vel = this.vel;

    this.game.forEachPlatform( function(p) {
      // Are we crossing Y.
      if (p.rect.y >= oldY && p.rect.y < pos.y) {

        // Is our X within platform width
        if (pos.x > p.rect.x && pos.x < p.rect.right) {

          // Collision. Let's jump!
          pos.y = p.rect.y;
          vel.y = -JUMP_VELOCITY;
        }
      }
    });
  };

  Player.prototype.checkGameover = function() {
    if (this.pos.y > this.EDGE_OF_LIFE) {
      this.game.gameover();
    }
  };

  Player.prototype.reset = function() {
    controls.reset();
    this.vel.y = 0;
  };

  return Player;
});