/*global define, Howl */

define(['controls', 'player', 'platform', 'spring', 'controls'],
  function(controls, Player, Platform, Spring, controls) {

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
    this.mainMenuEl = el.find('.mainmenu');
    this.gameTextEl = el.find('.gameoverarea');
    this.hudEl = el.find('.hud');
    this.mainMenuEl.addClass('showmenu');
    this.hudEl.addClass('showmenu');
    this.showMenu = true;
    this.transform = $.fx.cssPrefix + 'transform';
    this.centerX = this.width / 2;
    this.entities = [];
    this.worldEl = el.find('.world');
    this.backgroundEl = el.find('.background');
    this.springsEl = el.find('.springs');
    this.platformsEl = el.find('.platforms');
    this.platformCount = 0;
    this.visiblePlatforms = 15;
    this.elevation = 0;
    this.oldElevation = 0;
    this.difficulty = 0;

    this.score = 0;
    this.scoreEl = this.el.find('.score .value');
    this.highScore = 0;
    this.highScoreEl = this.el.find('.highscore .value');
    this.elevationEl = this.el.find('.elevation .value');
    this.cityscapeEl = this.el.find('.cityscape');

    this.player = new Player(this.el.find('.player'), this);

    if (navigator.userAgent.match(/(android|iphone|ipad)/i)) {
      this.mobile = true;
      this.gameTextEl.addClass('mobile');
    }

    if (!this.mobile) {
      this.themesound = new Howl({
        urls: ['sounds/skyjump.mp3'],
        loop: true,
        volume: 0.5,
        sprite: {
          theme: [0, 8300]
        }
      });
      this.sounds = new Howl({
        urls: ['sounds/disappointed.mp3'],
        sprite: {
          gameover: [0, 1800]
        }
      });
    }

    // Cache a bound onFrame since we need it each frame.
    this.onFrame = this.onFrame.bind(this);
    controls.on('touch', this.onScreenTouch.bind(this));
  };

  Game.prototype.onScreenTouch = function() {
    if ( !this.isPlaying || this.showMenu ) {
      this.showMenu = false;
      this.mainMenuEl.removeClass('showmenu');
      this.hudEl.removeClass('showmenu');
      if ( !this.isPlaying ) {
        this.reset();
      }
    }
  };

  /**
   * Reset all game state for a new game.
   */
  Game.prototype.reset = function() {
    this.elevation = 0;
    this.oldElevation = 0;
    this.score = 0;
    this.scoreEl.text( 0 );
    this.elevationEl.text( 0 );
    this.difficulty = 0;
    this.cityscapeEl.css(this.transform, 'translate3d(0px,0px,0)');
    this.backgroundEl.css(this.transform, 'translate3d(0px,0px,0)');
    this.worldEl.css(this.transform, 'translate3d(0,0,0)');

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
    this.topmostPlatform.el.css(this.transform, 'translate3d(' + groundPlatform.x + 'px,' + groundPlatform.y + 'px,0)');

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
    newPlatform.el.css(this.transform, 'translate3d(' + newPlatformX + 'px,' + newPlatformY + 'px,0)');
    this.topmostPlatform = newPlatform;

    // Randomly add a spring on top of platform
    if ( Math.random() < 0.1 )
    {
      var newSpring = new Spring({
        x: newPlatformX + Math.random() * Platform.defaultWidth,
        y: newPlatformY
      });
      this.addSpring(newSpring);
      newSpring.el.css(this.transform, 'translate3d(' + newSpring.pos.x + 'px,' + newSpring.pos.y + 'px,0)');
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
   * Add a single spring to the world
   * @param {Spring} spring The spring to add
   */
  Game.prototype.addSpring = function(spring) {
    this.entities.push(spring);
    this.springsEl.append(spring.el);
    this.platformCount++;
  };

  /**
   * Runs every frame. Calculates a delta and allows each game entity to update itself.
   */
  Game.prototype.onFrame = function() {
    if (!this.isPlaying) {
      requestAnimFrame(this.onFrame);
      return;
    }

    var now = +new Date() / 1000,
        delta = now - this.lastFrame;
    this.lastFrame = now;

    if (!this.showMenu) {
      controls.onFrame(delta);
    }
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

      // Scroll the background and cityscape separately on desktops to
      // create a parallax effect
      if (!this.mobile) {
        this.bgParallaxEffect = 0.2;
        this.cityscapeEl.css(this.transform, 'translate3d(0px,' + (-(this.elevation * 0.75)) + 'px,0)');
      }
      else {
        this.bgParallaxEffect = 1.0;
      }
      var backgroundY = -(this.elevation * this.bgParallaxEffect);
      backgroundY -= 300 * Math.floor( this.elevation * (1 - this.bgParallaxEffect) / 300 + 1 );
      var oldBackgroundY = -(this.oldElevation * this.bgParallaxEffect);
      oldBackgroundY -= 300 * Math.floor( this.oldElevation * (1 - this.bgParallaxEffect) / 300 + 1 );

      // Check if we need to re-use background
      if (backgroundY != oldBackgroundY) {
        this.backgroundEl.css(this.transform, 'translate3d(0px,' + backgroundY + 'px,0)');
        this.oldElevation = this.elevation;
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
      this.forEachSpring( function(s) {
        // If the spring has gone blow the visible area, remove it from memory
        if ( s.pos.y > self.viewport.y + self.height + 16 ) {
          s.begone();
        }
      });
      this.worldEl.css(this.transform, 'translate3d(0,' + (-this.viewport.y) + 'px,0)');
    }
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
    this.gameTextEl.addClass('gameover');
    if (!this.mobile) {
      this.sounds.play('gameover');
    }
    this.freezeGame();
  };

  /**
   * Freezes the game. Stops the onFrame loop and stops any CSS3 animations.
   * Can be used both for game over and pause.
   */
  Game.prototype.freezeGame = function() {
    this.isPlaying = false;
    this.el.addClass('frozen');
    if (!this.mobile) {
      this.themesound.stop();
    }
  };

  /**
   * Unfreezes the game. Starts the game loop again.
   */
  Game.prototype.unfreezeGame = function() {
    if (!this.isPlaying) {
      this.isPlaying = true; 
      this.el.removeClass('frozen');
      this.gameTextEl.removeClass('gameover');

      if (!this.mobile) {
        this.themesound.play('theme');
      }

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

  Game.prototype.forEachSpring = function(fun) {
    for (var i = 0, e; e = this.entities[i]; i++) {
      if (e instanceof Spring) {
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