# Web Port Notes 1/7

## Engine mapping

The supplied `codea-lite.js` provides:

- `setup()`
- `draw()`
- `touched(touch)`
- `WIDTH`, `HEIGHT`
- `DeltaTime`, `ElapsedTime`
- `color()`, `rect()`, `ellipse()`, `line()`, `text()`
- `pushMatrix()`, `popMatrix()`, `translate()`, `scale()`
- pointer input mapped to Codea-like `BEGAN`, `MOVING`, `ENDED`, `CANCELLED`

## Port policy

For 1/7, the priority is not final visuals. It is:

1. Boot on GitHub Pages
2. Preserve the main game loop
3. Preserve touch feel
4. Confirm scene flow
5. Identify web-only differences

## Visual direction deferred

The poster-like retro cafe look will be handled after this version is stable.
Keep the current brown prototype look until movement and touch are verified.
