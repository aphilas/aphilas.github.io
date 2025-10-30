---
layout: ../../layouts/PostLayout.astro
pubDate: 2023-07-11
title: "HTML Media Element Playing State"
description: "Using a state machine for HTML Media Element playing state"
tags:
- html
- media
---

I am building a web radio player, a frontend to RadioBrowser dubbed [Luqaimat](https://luqaimat.stream). I need to know the state of the media (playing, paused, buffering, stopped et cetera) so as to display the correct icons and titles, and to start/stop a visualization. It seems trivial, but at some point I would get the wrong state (e.g. naively assuming the media is stopped on receiving a [`stalled`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/stalled_event) event). 

## A state machine, sort of

It might be helpful to think of the state of the media player like a state machine. In TypeScript, these are the valid states:

```ts
export enum PlayingState {
  STOPPED = "STOPPED",
  PLAYING = "PLAYING",
  BUFFERING = "BUFFERING",
  PAUSED = "PAUSED",
  ERROR = "ERROR",
}
```

Despite poring over the [MDN HTMLMediaElement docs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events) I couldn't still understand some edge cases. The [WHATWG standard](https://html.spec.whatwg.org/multipage/media.html) was very helpful in determining the exact state of the network/media after receiving certain events. 

![HTML Media Element State Machine](/html-media-state.svg "HTML Media Element State Machine")

I settled on the following: handle all DOM media events and state transitions in one function with a switch statement. This removed a lot of flakiness unlike my previous code where state transitions were made imperatively after certain user actions.

```ts
function handleMediaEvent(event: Event) {
  switch (event.type) {
    case "play": // Play triggered manually
    case "playing": // Resume playing after buffering
      state = PlayingState.PLAYING;
      break;
    case "pause":
      if (sourceElem?.src) {
        state = PlayingState.PAUSED;
      } else {
        state = PlayingState.STOPPED;
      }
      break;
    case "waiting":
      state = PlayingState.BUFFERING;
      break;
    case "ended":
      state = PlayingState.STOPPED;
      break;
    case "error":
      state = PlayingState.ERROR;
      break;
    default:
      console.log("Unhandled media event", event.type);
      break;
  }
}
```

## Stopping streaming media 

You might notice that we handle two states on `pause` - paused and stopped. HTML Media elements do not natively handle "stop" actions. Simply setting `player.currentTime = 0` keeps downloading the stream. Setting `player.src  = ''` on the other hand throws an error since the source is effectively set to the page's base url. The solution is to pause the media, and then remove the `src` attribute from the `<source>`/`<audio>`/`<video>` element to stop further network requests. Additionally, this ensures that if someone hits stop, they jump _to live_ on play (as contrasted to pause where you resume from the previous position). 

---

Feel free to play around with [luqaimat](https://luqaimat.stream) and suggest features or report bugs.

Do you know of a way simplify my logic? Would you want to shed more light on anything I have addressed? Let me know on [Mastodon](https://mastodon.online/@aphilas) or shoot me an [email](/contact#email).
