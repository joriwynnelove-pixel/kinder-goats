import { test } from "node:test";
import assert from "node:assert/strict";
import { videoInfo, socialEmbed } from "../lib/embeds.js";

test("YouTube links of every common shape are recognised", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtu.be/aqz-KE-bpKQ",
    "https://www.youtube.com/shorts/aqz-KE-bpKQ",
    "https://m.youtube.com/watch?feature=share&v=aqz-KE-bpKQ",
  ]) {
    const v = videoInfo(url);
    assert.equal(v.kind, "youtube", url);
    assert.match(v.embed, /youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/);
  }
});

test("Vimeo links are recognised", () => {
  assert.equal(videoInfo("https://vimeo.com/76979871").kind, "vimeo");
});

test("anything else becomes a plain link", () => {
  const v = videoInfo("https://www.facebook.com/somefarm/videos/123");
  assert.equal(v.kind, "link");
  assert.equal(v.embed, "");
});

test("public Facebook, Instagram and Threads posts become embeds", () => {
  assert.equal(socialEmbed("https://www.facebook.com/farm/posts/pfbid0abc").kind, "facebook");
  assert.match(socialEmbed("https://www.facebook.com/farm/videos/123/").src, /plugins\/video\.php/);
  assert.equal(
    socialEmbed("https://www.instagram.com/p/C1a2B3c4D5e/?igsh=xyz").src,
    "https://www.instagram.com/p/C1a2B3c4D5e/embed/captioned/"
  );
  assert.equal(
    socialEmbed("https://www.threads.net/@farm/post/C9xYz12AbCd").src,
    "https://www.threads.net/@farm/post/C9xYz12AbCd/embed"
  );
  assert.equal(socialEmbed("https://example.com/news").kind, "link");
  assert.equal(socialEmbed("not a link").kind, "link");
});
