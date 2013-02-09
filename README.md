# Skyjump

HTML5 Game

APP DEVELOPMENT - HTML (T-432-HTML)

## Author & Licence
 Freyr Bergsteinsson <<freyrb12@ru.is>>

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/3.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US">Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License</a>.

## Device support

This game has been tested on:

- Chrome 21 on MacOS X 10.5
- Firefox 11 on MacOS X 10.5
- iPhone 5
- Firefox 18 on Android 2.2
- Chrome 24 on Fedora 17
- Firefox 18 on Fedora 17
- Chrome 24 on Windows 7
- Firefox 18 on Windows 7

Note: the gamma tilt is handled differently between Android and iPhone.

## List of extra features

- Main menu
- Parallax scrolling effect
- Starting cityscape
- Platforms can always be reached
- Platforms are never placed in the initial "jumping lane" when starting a new game
- Platforms never overlap
- Platforms are textured
- Platforms have a larger bounding box than what is displayed
- Increased difficulty - platforms become further apart with increased elevation
- Game over screen shows "press space" when not on mobile devices
- Player mouth animation when moving
- Background image is looped
- Spring objects
  - Placed on 10% of the platforms
  - Randomly placed horizontally on the platform
  - Have their own collision detection
  - Increases jump distance

### Incomplete features

This is a list of features next on the TODO list that I didn't have time to implement.

- Horizontally moving platforms (with a different texture)
- Vertically moving platforms (with a different texture)
- Trampoline items, similar to springs but trigger a sommersault player animation
- Scroll the world back up when player falls to their death before the game over screen
- Use CSS sprites for optimization
- Sound and music
