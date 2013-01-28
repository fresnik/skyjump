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
    this.EDGE_OF_LIFE = game.height + 2*el.height();
    this.WORLD_SCROLL_HEIGHT = game.height / 2;
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

    // Generate platforms at random position with space
    // DEVELOPER STUFF - TODO: BEGIN REMOVE
    if (controls.keys.space) {
      this.game.addRandomPlatform();
    }
    if (controls.keys.i) {
      this.game.listAllPlatforms();
    }
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
    this.checkVertical(oldY);
    this.checkPlatforms(oldY);
    this.checkGameover();

    // Update player position
    this.el.css(transform, 'translate(' + this.pos.x + 'px,' + this.pos.y + 'px)');
    // Update platform positions
    var platforms = this.game.platforms;
    for (var i = 0, p; p = platforms[i]; i++) {
      p.el.css(transform, 'translate(' + p.rect.x + 'px,' + p.rect.y + 'px)');
    }

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

      // Go through all the platforms and move them down
      // by the mount the player is going up
      var platforms = this.game.platforms;

      for (var i = platforms.length-1, p; p = platforms[i]; i--) {
        p.rect.y -= dY;

        // If the platform has gone blow the visible area, remove it from memory
        if ( p.rect.y > this.game.height )
        {
          this.game.removePlatform( p );
        }
      }
    }
  };

  /**
   * Check if player is touching a platform on the way down
   * @param  {number} oldY Last known vertical position of player
   */
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