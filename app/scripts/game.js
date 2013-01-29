/*global define, alert */

define(['player', 'platform'], function(Player, Platform) {
  /**
   * Main game class.
   * @param {Element} el DOM element containig the game.
   * @constructor
   */
  var Game = function(el) {
    this.el = el;
    this.width = $('.container').width();
    this.height = $('.container').height();
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
    this.player.pos = {x: 200, y: 418};

    // Start game
    this.unfreezeGame();
  };

  Game.prototype.createPlatforms = function() {
    // ground
    this.addPlatform(new Platform({
      x: 0,
      y: this.height - 15,
      width: this.width - 6,
      height: Platform.defaultHeight
    }));

    // A few random platforms to start the game
    for ( var i = 0; i < this.visiblePlatforms; i++ )
    {
      this.addPlatform(new Platform({
            x: Math.random() * (this.width - Platform.defaultWidth),
            y: Math.random() * (this.height - Platform.defaultHeight) - 2*Platform.defaultHeight,
            width: Platform.defaultWidth,
            height: Platform.defaultHeight
          }));
    }
    // Create another bunch of unseen platforms above the game are
    for ( i = 0; i < this.visiblePlatforms; i++ )
    {
      this.addRandomPlatform();
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
      this.addRandomPlatform();
    }

    // Scroll the background, but not as much as platforms, which will
    // create a parallax effect
    $('.container').css('background-position', "0px " + (this.elevation / 5) +"px");
  }
  /**
   * Runs every frame. Calculates a delta and allows each game entity to update itself.
   */
  Game.prototype.onFrame = function() {
    if (!this.isPlaying) {
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

    var game = this;
    setTimeout(function() {
      game.reset();
    }, 0);
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
    this.scoreEl.innerText = "Score: " + score;
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
    this.highScoreEl.innerText = "Highscore: " + this.highScore;
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