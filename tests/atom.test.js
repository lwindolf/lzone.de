import { AtomParser } from "../www/js/feedreader/parsers/atom";

test("atom parse", () => {
        let feed = AtomParser.parse(`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">

  <title>Example Feed</title>
  <link href="http://example.org/"/>
  <updated>2003-12-13T18:30:02Z</updated>
  <author>
    <name>John Doe</name>
  </author>
  <id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>

  <entry>
    <title>Atom-Powered Robots Run Amok</title>
    <link href="http://example.org/2003/12/13/atom03/html/" rel="alternate"/>
    <link href="http://example.org/2003/12/13/atom03"/>
    <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
    <updated>2003-12-13T18:30:02Z</updated>
    <summary>Some text.</summary>
  </entry>

  <entry>
  <title>Entry 2</title>
  <link data="abc"/>
  <link href="http://example.org/2003/12/13/atom02"/>
  <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6b</id>
  <dc:date>2003-12-13T18:40:10Z</dc:date>
  <summary>Some text.</summary>
</entry>

</feed>`);

        expect(feed.error).toBe(undefined);
        expect(feed.title).toBe('Example Feed');
        expect(feed.homepage).toBe('http://example.org/');
        expect(feed.items.length).toBe(2);
        expect(feed.items[0].description).toBe('Some text.');
        expect(feed.items[0].source).toBe('http://example.org/2003/12/13/atom03/html/');
        expect(feed.items[0].sourceId).toBe('urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a');
        expect(feed.items[0].time).toBe(1071340202);

        expect(feed.items[1].source).toBe('http://example.org/2003/12/13/atom02');
        expect(feed.items[1].sourceId).toBe('urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6b');
        expect(feed.items[1].time).toBe(1071340810);
});

test("atom parse link", () => {
  let feed = AtomParser.parse(`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>Example Feed</title>
<link href="http://example.org/" ref="self"/>
<link borkedhref="http://example.org/borked"/>
<link href="http://example.org/home" rel="alternate"/>
</feed>`);

  expect(feed.homepage).toBe("http://example.org/home");
});

test("atom parse error", () => {
        let feed = AtomParser.parse(`<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">

          <title>Example Feed</title>
          <link href="http://example.org/"/>
          <updated>2003-12-13T18:30:02Z</updated>
          <author>
          BROKEN HERE
        `);

        expect(!feed.error).toBe(false);
});
