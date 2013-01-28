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

    this.player = new Player(this.el.find('.player'), this);
    
    // Cache a bound onFrame since we need it each frame.
    this.onFrame = this.onFrame.bind(this);
  };

  /**
   * Reset all game state for a new game.
   */
  Game.prototype.reset = function() {
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
      height: 10
    }));
  };

  Game.prototype.addRandomPlatform = function() {
    this.addPlatform(new Platform({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          width: 100,
          height: 10
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

  Game.prototype.listAllPlatforms = function() {
    console.log("===========");
    for (var i = 0, p; p = this.platforms[i]; i++)
    {
      console.log("Platform at (" + p.rect.x + "," + p.rect.y + ")");
    }
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
    alert('Game over!');
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