/* Family Code Word Setup: makes a random, hard-to-guess code phrase and a short plan
   for checking a caller's identity against AI voice-clone scams. Nothing is saved. */
(function (root) {
  const FW = root.FW;
  const WORDS = ("anchor apple arrow autumn badger bagel bamboo banjo barn basket beacon beetle biscuit blanket bloom bonfire breeze brick bucket buffalo butter cactus camel candle canoe canyon carrot castle cedar cherry chimney cinnamon clover cobalt comet copper coral cotton crayon cricket crystal cypress daisy dolphin dragonfly drum eagle ember falcon feather fern fiddle firefly flannel flute forest fossil fox galaxy garden garnet ginger glacier goose granite grape gravel harbor hazel hedgehog helmet hickory honey horizon iceberg igloo indigo island ivory jacket jasmine jelly juniper kayak kettle kiwi koala ladder lagoon lantern lemon lilac lobster lotus magnet mango maple marble meadow melon meteor mitten moose mosaic mustard nectar nutmeg oak oasis olive orbit orchid otter owl paddle panda pebble pelican pepper pickle pine pirate planet plum pony puzzle quartz quill rabbit radish rainbow raven reef ribbon river robin rocket saddle saffron salmon sandal scarf seashell sequoia shamrock sierra silver sparrow spruce squash squirrel summit sunflower swan teapot thistle thunder tiger timber toffee topaz tractor trumpet tulip tundra turtle umbrella valley velvet violet volcano waffle walnut walrus willow window yarn yeti zebra zephyr").split(" ");

  function pick(n) {
    const out = [], buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / WORDS.length) * WORDS.length;
    while (out.length < n) { crypto.getRandomValues(buf); if (buf[0] < limit) { const w = WORDS[buf[0] % WORDS.length]; if (!out.includes(w)) out.push(w); } }
    return out;
  }

  if (typeof document === "undefined") return;
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("cw-form");
    if (!form) return;
    const out = document.getElementById("cw-out");
    let phrase = pick(2).join(" ");

    function plan() {
      const who = form.who.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      const people = who.length ? who.join(", ") : "everyone in the family";
      return [
        `FAMILY SAFETY PLAN`,
        ``,
        `Code phrase: ${phrase}`,
        `Shared with: ${people}`,
        ``,
        `1. If anyone calls, texts or video-calls asking for money, gift cards, crypto, bail, or a "secret" favor, even if it sounds exactly like one of us, ask for the code phrase.`,
        `2. No code phrase, no money. Hang up and call the person back on the number you already have for them.`,
        `3. Never say the code phrase first, and never text or email it. Keep it off social media and out of shared notes.`,
        `4. If you can't reach them, call another family member on this list before doing anything.`,
        `5. Real emergencies can wait the two minutes it takes to call back.`,
        ``,
        `Why: scammers can clone a voice from a few seconds of audio taken from videos, voicemail greetings or calls.`,
      ].join("\n");
    }
    function render() {
      document.getElementById("cw-phrase").textContent = phrase;
      out.value = plan();
    }
    document.getElementById("cw-new").addEventListener("click", () => { phrase = pick(2).join(" "); render(); });
    form.addEventListener("input", render);
    form.addEventListener("submit", (e) => e.preventDefault());
    document.getElementById("cw-copy").addEventListener("click", () =>
      FW.copy(out.value, out).then((ok) => (document.getElementById("cw-copied").textContent = ok ? "Copied. Share it in person or by phone." : "Selected: press Ctrl+C or Cmd+C.")));
    render();
  });
})(typeof window !== "undefined" ? window : globalThis);
