# 5/7 KISSA FORTUNE root fix

## Root-cause rethink
The previous structure let the fortune scene depend on an extra asynchronous completion path.
That made the fortune phase vulnerable to state divergence on mobile web.

This version rewrites the fortune flow so the main update loop is the only owner of progression.

## New structure
- `jdNextFood()` now enters fortune with `pendingFood`
- the fortune machine only displays and counts down a frame-driven timer
- when the timer ends, `jdCompleteFortuneSpin()` creates the next `JD.food`
- no `setTimeout` based completion
- no absolute-time fallback
- no tap-to-skip workaround

## Visual adjustments
- increased space between the top sign and the roulette
- moved the roulette slightly downward for better balance
