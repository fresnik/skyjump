/*global define, alert */

define(['controls', 'player', 'platform', 'controls'], function(controls, Player, Platform, controls) {

  var VIEWPORT_PADDING = 240;

  /**
   * Main game class.
   * @param {Element} el DOM element containig the game.
   * @constructor
   */
  var Game = function(el) {
    this.el = el;
    this.width = $('.container').width();
    this.height = $('.container').height();
    this.transform = $.fx.cssPrefix + 'transform';
    this.centerX = this.width / 2;
    this.entities = [];
    this.worldEl = el.find('.world');
    this.backgroundEl = el.find('.background');
    this.platformsEl = el.find('.platforms');
    this.platformCount = 0;
    this.visiblePlatforms = 15;
    this.elevation = 0;
    this.difficulty = 0;

    this.score = 0;
    this.scoreEl = this.el.find('.score .value');
    this.highScore = 0;
    this.highScoreEl = this.el.find('.highscore .value');
    this.elevationEl = this.el.find('.elevation .value');
    this.cityscapeEl = this.el.find('.cityscape');

    this.player = new Player(this.el.find('.player'), this);

    // Cache a bound onFrame since we need it each frame.
    this.onFrame = this.onFrame.bind(this);
    controls.on('touch', this.onScreenTouch.bind(this));
  };

  Game.prototype.onScreenTouch = function() {
    if ( !this.isPlaying )
    {
      this.reset();
    }
  };

  /**
   * Reset all game state for a new game.
   */
  Game.prototype.reset = function() {
    this.elevation = 0;
    this.score = 0;
    this.scoreEl.text( 0 );
    this.elevationEl.text( 0 );
    this.difficulty = 0;
    this.cityscapeEl.css(this.transform, 'translate(0px,0px)');
    this.backgroundEl.css(this.transform, 'translate(0px,0px)');

    // Remove all platforms from the world
    this.entities.forEach(function(e) { e.el.remove(); });
    this.entities = [];
    this.platformCount = 0;

    this.viewport = {x: 0, y: 0, width: this.width, height: this.height};

    // Create starting world entities
    this.createWorld();

    this.player.reset();
    this.player.pos = {x: this.width / 2, y: this.height - 200};

    // Start game
    this.unfreezeGame();
  };

  Game.prototype.createWorld = function() {
    var groundPlatform = {
      x: this.centerX - (Platform.defaultWidth / 2),
      y: this.height - Platform.defaultHeight - 5
    };

    // ground
    this.addPlatform(new Platform({
      x: groundPlatform.x,
      y: groundPlatform.y,
      width: Platform.defaultWidth,
      height: Platform.defaultHeight
    }));
    this.topmostPlatform = this.entities[0];
    this.topmostPlatform.el.css(this.transform, 'translate(' + groundPlatform.x + 'px,' + groundPlatform.y + 'px)');

    // Place random platforms until we can reach the top
    // Also make sure we have the minimal number of visible platforms
    var canReachTop = false;
    do
    {
      this.addOnePlatform(true);
    } while (this.platformCount < this.visiblePlatforms);
  };

  /**
   * Create a platform at a random location above the currently topmost platform,
   * and make sure it's reachable.
   */
  Game.prototype.addOnePlatform = function(startingPlatform) {
    var platformOk = true;

    // Position the platform above the topmost platform
    var newPlatformX = Math.random() * (this.width - Platform.defaultWidth);
    var minimumPlatformDist = 3*(Platform.defaultHeight + 3);
    var maxRandomJumpDist = Player.JUMP_DIST - minimumPlatformDist;
    var minRandomJumpDist = maxRandomJumpDist - ( ( 100 - this.difficulty ) / 100 ) * maxRandomJumpDist;
    var randomJumpDist = Math.random() * ( maxRandomJumpDist - minRandomJumpDist ) + minRandomJumpDist;
    randomJumpDist *= ((this.difficulty + 1)/101);
    var newPlatformY = this.topmostPlatform.rect.y - (minimumPlatformDist + randomJumpDist);

    // Make sure our inital platforms aren't in the vertical jumping lane
    // from the player starting position
    if ( startingPlatform === true )
    {
      do
      {
        newPlatformX = Math.random() * (this.width - Platform.defaultWidth);
        platformOk = !((newPlatformX > this.centerX - Platform.defaultWidth - 5)
        && (newPlatformX < this.centerX + Platform.defaultWidth + 5)
        && (newPlatformY > 300));
      } while (!platformOk);
    }

    var newPlatform = new Platform({
          x: newPlatformX,
          y: newPlatformY,
          width: Platform.defaultWidth,
          height: Platform.defaultHeight
        });

    this.addPlatform(newPlatform);
    newPlatform.el.css(this.transform, 'translate(' + newPlatformX + 'px,' + newPlatformY + 'px)');
    if ( newPlatformY < this.topmostPlatform.rect.y ) {
      this.topmostPlatform = newPlatform;
    }
  };

  /**
   * Create new platforms at random spots above the game area
   */
  Game.prototype.addRandomPlatform = function() {
    this.addPlatform(new Platform({
          x: Math.random() * (this.width - Platform.defaultWidth),
          y: Math.random() * (this.height - Platform.defaultHeight) - this.height,
          width: Platform.defaultWidth,
          height: Platform.defaultHeight
        }));
  };

  /**
   * Add a single platform to the world
   * @param {Platform} platform The platform to add
   */
  Game.prototype.addPlatform = function(platform) {
    this.entities.push(platform);
    this.platformsEl.append(platform.el);
    this.platformCount++;
  };

  /**
   * Runs every frame. Calculates a delta and allows each game entity to update itself.
   */
  Game.prototype.onFrame = function() {
    var gameText = this.el.find('.gameoverarea');
    gameText.toggleClass('gameover', !this.isPlaying);

    if (!this.isPlaying) {
      requestAnimFrame(this.onFrame);
      return;
    }

    var now = +new Date() / 1000,
        delta = now - this.lastFrame;
    this.lastFrame = now;

    controls.onFrame(delta);
    this.player.onFrame(delta);

    for (var i = 0, e; e = this.entities[i]; i++) {
      e.onFrame(delta);

      if (e.dead) {
        this.entities.splice(i--, 1);
      }
    }

    this.updateViewport();

    // Request next frame.
    requestAnimFrame(this.onFrame);
  };


  /**
   * Perform a vertical scroll of the world, moving platforms and
   * background, removing out of sight platforms and adding new ones
   */
  Game.prototype.updateViewport = function() {
    // Find min Y for player in world coordinates.
    var minY = this.viewport.y + VIEWPORT_PADDING;

    // Player position
    var playerY = this.player.pos.y;

    //Update the viewport if needed.
    if (playerY < minY) {
      this.elevation += (minY - playerY);
      this.elevationEl.text( Math.floor( this.elevation ) );

      this.viewport.y = playerY - VIEWPORT_PADDING;
      while ( this.platformCount < 2 * this.visiblePlatforms ) {
        this.addOnePlatform(false);
      }
      var backgroundY = -(this.elevation * 0.2);
      // Check if we need to re-use background
      backgroundY = backgroundY - 300 * Math.floor( this.elevation*0.8 / 300 + 1 );

      // Scroll the background, but not as much as platforms, which will
      // create a parallax effect
      this.backgroundEl.css(this.transform, 'translate3d(0px,' + backgroundY + 'px,0)');
      if (this.elevation < 720) {
        this.cityscapeEl.css(this.transform, 'translate3d(0px,' + (-(this.elevation * 0.75)) + 'px,0)');
      }

      var self = this;

      this.forEachPlatform( function(p) {
        // If the platform has gone blow the visible area, remove it from memory
        if ( p.rect.y > self.viewport.y + self.height ) {
          p.begone();
          self.platformCount--;
          self.score++;
          if ( self.difficulty < 100 ) {
            self.difficulty += 0.5;
          }
          self.scoreEl.text( self.score );
          if ( self.score > self.highScore ) {
            self.highScore = self.score;
            self.highScoreEl.text( self.highScore );
          }
        }
      });
    }

    this.worldEl.css(this.transform, 'translate3d(0,' + (-this.viewport.y) + 'px,0)');
  };

  /**
   * Starts the game.
   */
  Game.prototype.start = function() {
    this.reset();
  };

  /**
   * Stop the game and notify user that he has lost.
   */
  Game.prototype.gameover = function() {
    this.freezeGame();
  };

  /**
   * Freezes the game. Stops the onFrame loop and stops any CSS3 animations.
   * Can be used both for game over and pause.
   */
  Game.prototype.freezeGame = function() {
    this.isPlaying = false;
    this.el.addClass('frozen');
  };

  /**
   * Unfreezes the game. Starts the game loop again.
   */
  Game.prototype.unfreezeGame = function() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.el.removeClass('frozen');

      // Restart the onFrame loop
      this.lastFrame = +new Date() / 1000;
      requestAnimFrame(this.onFrame);
    }
  };

  Game.prototype.forEachPlatform = function(fun) {
    for (var i = 0, e; e = this.entities[i]; i++) {
      if (e instanceof Platform) {
        fun(e);
      }
    }
  };

  /**
   * Cross browser RequestAnimationFrame
   */
  var requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function */ callback) {
          window.setTimeout(callback, 1000 / 60);
        };
  })();

  return Game;
});