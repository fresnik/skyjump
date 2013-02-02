/*global define, alert */

define(['player', 'platform', 'controls'], function(Player, Platform, controls) {
  /**
   * Main game class.
   * @param {Element} el DOM element containig the game.
   * @constructor
   */
  var Game = function(el) {
    this.el = el;
    this.width = $('.container').width();
    this.height = $('.container').height();
    this.centerX = this.width / 2;
    this.entities = [];
    this.platformsEl = el.find('.platforms');
    this.platformCount = 0;
    this.visiblePlatforms = 15;
    this.elevation = 0;

    this.score = 0;
    this.scoreEl = this.el.find('.score .value');
    this.highScore = 0;
    this.highScoreEl = this.el.find('.highscore .value');
    this.elevationEl = this.el.find('.elevation .value');
    this.cityscapeEl = this.el.find('.cityscape');

    this.player = new Player(this.el.find('.player'), this);

    // Cache a bound onFrame since we need it each frame.
    this.onFrame = this.onFrame.bind(this);
  };

  /**
   * Reset all game state for a new game.
   */
  Game.prototype.reset = function() {
    this.elevation = 0;
    this.score = 0;
    this.scoreEl.text( 0 );
    this.elevationEl.text( 0 );
    var transform = $.fx.cssPrefix + 'transform';
    this.cityscapeEl.css(transform, 'translate(0px,0px)');
    $('.container').css('background-position', "0px 0px");

    // Remove all platforms from the world
    this.entities.forEach(function(e) { e.el.remove(); });
    this.entities = [];
    this.platformCount = 0;

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

    // Place random platforms until we can reach the top
    // Also make sure we have the minimal number of visible platforms
    var canReachTop = false;
    do
    {
      this.addOnePlatform(true);
      canReachTop = canReachTop ||
          ( this.topmostPlatform.rect.y - Player.JUMP_DIST + Platform.defaultHeight < 0 );
    } while (!canReachTop || this.platformCount < this.visiblePlatforms);
  };

  /**
   * Create a platform at a random location, but make sure it's reachable.
   * A platform can be reached if it is in an inverse double parabolic area
   * from the currently highest platform.
   */
  Game.prototype.addOnePlatform = function(startingPlatform) {
    do
    {
      var platformOk = true;
      // Position the platform above the game area unless we have a starting platform (handled below)
      var newPlatformX = Math.random() * (this.width - Platform.defaultWidth);
      var newPlatformY = Math.random() * (this.height + Platform.defaultHeight) - this.height;

      // Make sure our inital platforms aren't in the vertical jumping lane
      // from the player starting position
      if ( startingPlatform === true )
      {
        do
        {
          newPlatformY = Math.random() * (this.height - Platform.defaultHeight);
          platformOk = !((newPlatformX > this.centerX - Platform.defaultWidth)
          && (newPlatformX < this.centerX + Platform.defaultWidth)
          && (newPlatformY > 300));
        } while (!platformOk);
      }

      // Check if our new platform is higher than the currently highest platform
      // plus the player's jump distance (no need for parabolic check)
      platformOk = platformOk && ( newPlatformY > this.topmostPlatform.rect.y - Player.JUMP_DIST );
    } while (!platformOk);

    // Make sure the new platform isn't overlapping with existing platforms
    for (var i = 0, p; p = this.entities[i]; i++) {
      if (p instanceof Platform) {
        if ( Math.abs(newPlatformX - p.rect.x) <= Platform.defaultWidth &&
             Math.abs(newPlatformY - p.rect.y) <= Platform.defaultHeight + 4 )
        {
          newPlatformY += Platform.defaultHeight;
          i = 0;
        }
      }
    }

    var newPlatform = new Platform({
          x: newPlatformX,
          y: newPlatformY,
          width: Platform.defaultWidth,
          height: Platform.defaultHeight
        });

    this.addPlatform(newPlatform);
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
   * Perform a vertical scroll of the world, moving platforms and
   * background, removing out of sight platforms and adding new ones
   */
  Game.prototype.scrollWorld = function(delta) {
    this.elevation += -delta;
    this.elevationEl.text( Math.floor( this.elevation ) );

    // Go through all the platforms and move them down
    // by the amount the player is going up
    var self = this;

    this.forEachPlatform( function(p) {
      p.rect.y -= delta;

      // If the platform has gone blow the visible area, remove it from memory
      if ( p.rect.y > self.height )
      {
        p.begone();
        self.platformCount--;
        self.score++;
        self.scoreEl.text( self.score );
        if ( self.score > self.highScore )
        {
          self.highScore = self.score;
          self.highScoreEl.text( self.highScore );
        }
      }
    });

    while ( this.platformCount < 2 * this.visiblePlatforms )
    {
      this.addOnePlatform(false);
    }

    // Scroll the background, but not as much as platforms, which will
    // create a parallax effect
    $('.container').css('background-position', "0px " + (this.elevation / 5) +"px");
    if (this.elevation / 5 < 250)
    {
      var transform = $.fx.cssPrefix + 'transform';
      this.cityscapeEl.css(transform, 'translate(0px,' + (this.elevation / 5) + 'px)');
    }
  }
  /**
   * Runs every frame. Calculates a delta and allows each game entity to update itself.
   */
  Game.prototype.onFrame = function() {
    var gameText = this.el.find('.gameoverarea');
    gameText.toggleClass('gameover', !this.isPlaying);

    if (!this.isPlaying) {
      if ( controls.keys.space )
      {
        this.reset();
      }
      requestAnimFrame(this.onFrame);
      return;
    }

    var now = +new Date() / 1000,
        delta = now - this.lastFrame;
    this.lastFrame = now;

    this.player.onFrame(delta);

    for (var i = 0, e; e = this.entities[i]; i++) {
      e.onFrame(delta);

      if (e.dead) {
        this.entities.splice(i--, 1);
      }
    }

    // Request next frame.
    requestAnimFrame(this.onFrame);
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