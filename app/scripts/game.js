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
    this.platformsEl = el.find('.platforms');
    this.visiblePlatforms = 15;
    this.elevation = 0;

    this.score = 0;
    this.scoreEl = this.el.find('.score')[0];
    this.highScore = 0;
    this.highScoreEl = this.el.find('.highscore')[0];

    this.player = new Player(this.el.find('.player'), this);

    // Cache a bound onFrame since we need it each frame.
    this.onFrame = this.onFrame.bind(this);
  };

  /**
   * Reset all game state for a new game.
   */
  Game.prototype.reset = function() {
    this.elevation = 0;
    this.updateScore( 0 );
    $('.container').css('background-position', "0px 0px");

    // Reset platforms.
    this.clearAllPlatforms();
    this.createPlatforms();

    this.player.reset();
    this.player.pos = {x: this.width / 2, y: this.height - 200};

    // Start game
    this.unfreezeGame();
  };

  Game.prototype.createPlatforms = function() {
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
    this.topmostPlatform = this.platforms[0];

    // Place random platforms until we can reach the top
    // Also make sure we have the minimal number of visible platforms
    var canReachTop = false;
    do
    {
      this.addOnePlatform(true);
      canReachTop = canReachTop ||
          ( this.topmostPlatform.rect.y - this.player.JUMP_DIST + Platform.defaultHeight < 0 );
    } while (!canReachTop || this.platforms.length < this.visiblePlatforms);
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
      platformOk = platformOk && ( newPlatformY > this.topmostPlatform.rect.y - this.player.JUMP_DIST );
    } while (!platformOk);

    // Make sure the new platform isn't overlapping with existing platforms
    for (var i = 0, p; p = this.platforms[i]; i++) {
      if ( Math.abs(newPlatformX - p.rect.x) <= Platform.defaultWidth &&
           Math.abs(newPlatformY - p.rect.y) <= Platform.defaultHeight + 4 )
      {
        newPlatformY += Platform.defaultHeight;
        i = 0;
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
    this.platforms.push(platform);
    this.platformsEl.append(platform.el);
  };

  /**
   * Remove all platforms from the world
   */
  Game.prototype.clearAllPlatforms = function() {
    this.platforms = [];
    this.platformsEl.empty();
  }

  /**
   * Remove a specific platform from the world
   */
  Game.prototype.removePlatform = function(platform) {
    var idx = this.platforms.indexOf( platform );
    if ( idx >= 0 )
    {
      platform.el.remove();
      this.platforms.splice( idx, 1 );
    }
  }

  /**
   * Perform a vertical scroll of the world, moving platforms and
   * background, removing out of sight platforms and adding new ones
   */
  Game.prototype.scrollWorld = function(delta) {
    this.elevation += -delta;

    // Go through all the platforms and move them down
    // by the amount the player is going up
    var platforms = this.platforms;

    for (var i = platforms.length-1, p; p = platforms[i]; i--) {
      p.rect.y -= delta;

      // If the platform has gone blow the visible area, remove it from memory
      if ( p.rect.y > this.height )
      {
        this.removePlatform( p );
        this.updateScore( this.score + 1 );
      }
    }

    while ( platforms.length < 2*this.visiblePlatforms )
    {
      this.addOnePlatform(false);
    }

    // Scroll the background, but not as much as platforms, which will
    // create a parallax effect
    $('.container').css('background-position', "0px " + (this.elevation / 5) +"px");
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

  /**
   * Update the score
   */
  Game.prototype.updateScore = function(score) {
    this.score = score;
    this.scoreEl.innerHTML = "Score: " + score;
    if ( score > this.highScore )
    {
      this.updateHighScore( score );
    }
  };

  /**
   * Update the highscore
   */
  Game.prototype.updateHighScore = function(highScore) {
    this.highScore = highScore;
    this.highScoreEl.innerHTML = "Highscore: " + this.highScore;
  }

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