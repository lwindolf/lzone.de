// vim: set ts=4 sw=4:

import { linkAutoDiscover, parserAutoDiscover } from "../www/js/feedreader/parsers/autodiscover";

test("Atom 1.0 auto discover", () => {
  let p = parserAutoDiscover(`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry><title>A</title></entry>
</feed>`);

  expect(p.id).toBe('atom');
});

test("RSS 1.0 auto discover", () => {
  let p = parserAutoDiscover(`<?xml version="1.0"?>
  <rdf:RDF 
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns="http://purl.org/rss/1.0/"
  >
  
          <channel rdf:about="http://www.xml.com/xml/news.rss">
                  <title>XML.com</title>
                  <link>http://xml.com/pub</link>
                  <description>
                          XML.com features a rich mix of information and services 
                          for the XML community.
                  </description>
  
                  <image rdf:resource="http://xml.com/universal/images/xml_tiny.gif" />
                  <items>
                          <rdf:Seq>
                                  <rdf:li resource="http://xml.com/pub/2000/08/09/xslt/xslt.html" />
                                  <rdf:li resource="http://xml.com/pub/2000/08/09/rdfdb/index.html" />
                          </rdf:Seq>
                  </items>
          </channel>
  
          <image rdf:about="http://xml.com/universal/images/xml_tiny.gif">
                  <title>XML.com</title>
                  <link>http://www.xml.com</link>
                  <url>http://xml.com/universal/images/xml_tiny.gif</url>
          </image>
  
          <item rdf:about="http://xml.com/pub/2000/08/09/xslt/xslt.html">
                  <title>Processing Inclusions with XSLT</title>
                  <link>http://xml.com/pub/2000/08/09/xslt/xslt.html</link>
                  <dc:date>2023-09-17T11:34:00+00:00</dc:date>
                  <description>Processing document inclusions with general XML tools can be ...</description>
          </item>
  </rdf:RDF>`);

  expect(p.id).toBe('rdf');
});

test("RSS 1.1 auto discover", () => {
  let p = parserAutoDiscover(`<Channel xmlns="http://purl.org/net/rss1.1#" 
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
  rdf:about="http://www.xml.com/xml/news.rss">
<title>XML.com</title>
<link>http://xml.com/pub</link>
<description>
  XML.com features a rich mix of information and services
  for the XML community.
</description>
<image rdf:parseType="Resource">
  <title>XML.com</title>
  <url>http://xml.com/universal/images/xml_tiny.gif</url>
</image>
<items rdf:parseType="Collection">
  <item rdf:about="http://www.xml.com/pub/a/2005/01/05/restful.html">
     <title>The Restful Web: Amazon's Simple Queue Service</title>
     <link>http://www.xml.com/pub/a/2005/01/05/restful.html</link>
     <description>In Joe Gregorio's latest Restful Web column...</description>
  </item>
</items>
</Channel>`);

  expect(p.id).toBe('rss');
});

test("RSS 2.0 auto discover", () => {
  let p = parserAutoDiscover(`<?xml version="1.0"?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
     <channel>
        <title>NASA Space Station News</title>
        <link>http://www.nasa.gov/</link>
        <description>A RSS news feed containing the latest NASA press releases on the International Space Station.</description>
        <language>en-us</language>
        <pubDate>Tue, 10 Jun 2003 04:00:00 GMT</pubDate>
        <lastBuildDate>Fri, 21 Jul 2023 09:04 EDT</lastBuildDate>
        <docs>https://www.rssboard.org/rss-specification</docs>
        <generator>Blosxom 2.1.2</generator>
        <managingEditor>neil.armstrong@example.com (Neil Armstrong)</managingEditor>
        <webMaster>sally.ride@example.com (Sally Ride)</webMaster>
        <atom:link href="https://www.rssboard.org/files/sample-rss-2.xml" rel="self" type="application/rss+xml" />
        <item>
           <title>Louisiana Students to Hear from NASA Astronauts Aboard Space Station</title>
           <link>http://www.nasa.gov/press-release/louisiana-students-to-hear-from-nasa-astronauts-aboard-space-station</link>
           <description>As part of the state's first Earth-to-space call...</description>
           <pubDate>Fri, 21 Jul 2023 09:04 EDT</pubDate>
           <guid>http://www.nasa.gov/press-release/louisiana-students-to-hear-from-nasa-astronauts-aboard-space-station</guid>
        </item>
     </channel>
  </rss>`);

  expect(p.id).toBe('rss');
});

test('RSS 2.0 atom ns auto discover', () => {
  let p = parserAutoDiscover(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"
xmlns:atom="http://www.w3.org/2005/Atom"
xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:psc="http://podlove.org/simple-chapters" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:fh="http://purl.org/syndication/history/1.0" xmlns:podcast="https://podcastindex.org/namespace/1.0" >

<channel>
<title>Chaosradio</title>
<link>https://chaosradio.de</link>
<description><![CDATA[Das monatliche Radio des Chaos Computer Club Berlin]]></description>
<lastBuildDate>Mon, 10 Jun 2024 08:18:43 +0000</lastBuildDate>

<image><url>https://chaosradio.de/wp-content/uploads/2018/10/Cover-1.png</url><title>Chaosradio</title><link>https://chaosradio.de</link></image>
<atom:link rel="self" type="application/rss+xml" title="Chaosradio (MP3 Audio)" href="https://chaosradio.de/feed/mp3" />
<atom:link rel="alternate" type="application/rss+xml" title="Chaosradio (MP4 Audio)" href="https://chaosradio.de/feed/m4a" />
<atom:link rel="alternate" type="application/rss+xml" title="Chaosradio (Opus Audio)" href="https://chaosradio.de/feed/opus" />
<atom:link rel="first" href="https://chaosradio.de/feed/mp3" />
<language>de-DE</language>
<fyyd:verify xmlns:fyyd="https://fyyd.de/fyyd-ns/">pw4qv7j8hczjvIpcXm2ocicit8mhc4ouxs24rv3</fyyd:verify>

<atom:contributor><atom:name>Marcus Richter</atom:name></atom:contributor>

<atom:contributor><atom:name>danimo</atom:name></atom:contributor>

<atom:contributor><atom:name>Kai</atom:name></atom:contributor>

<atom:contributor><atom:name>Helena</atom:name></atom:contributor>

<atom:contributor><atom:name>moe</atom:name></atom:contributor>

<atom:contributor><atom:name>Florian</atom:name></atom:contributor>

<podcast:person img="https://chaosradio.de/wp-content/uploads/2018/11/cba8Tqi-_400x400.jpg">Marcus Richter</podcast:person>

<podcast:person img="https://chaosradio.de/wp-content/uploads/2018/11/danimo_square_400x400.jpg">danimo</podcast:person>

<podcast:person img="https://www.gravatar.com/avatar/067080eaf4aa9c7d801b43c9db3751f0.jpg?s=512&amp;d=mm&amp;r=g">Kai</podcast:person>

<podcast:person img="https://chaosradio.de/wp-content/uploads/2021/10/Dnp8CIAO_400x400.jpg">Helena</podcast:person>

<podcast:person img="https://www.gravatar.com/avatar/8a97c9465486502515202fd31627fdae.jpg?s=512&amp;d=mm&amp;r=g">moe</podcast:person>

<podcast:person img="https://chaosradio.de/wp-content/uploads/2018/11/nh_Mj5Mg_400x400.png">Florian</podcast:person>
<generator>Podlove Podcast Publisher v4.1.10</generator>
<copyright>Chaos Computer Club</copyright>
<itunes:author>Chaos Computer Club Berlin</itunes:author>
<itunes:type>episodic</itunes:type>
<itunes:summary><![CDATA[Im monatlichen Chaosradio informiert der Chaos Computer Club Berlin seit 1995 über die Auswirkungen von Technik auf die Gesellschaft.]]></itunes:summary>
<itunes:category text="Technology" />
<itunes:category text="Society &amp; Culture" />
<itunes:category text="News" />


<itunes:owner>
  <itunes:name>Chaos Computer Club Berlin</itunes:name>
  <itunes:email>chaosradio@ccc.de</itunes:email>
</itunes:owner>
<itunes:image href="https://chaosradio.de/wp-content/uploads/2018/10/Cover-1.png"/>
<itunes:subtitle>Das monatliche Radio des Chaos Computer Club Berlin</itunes:subtitle>
<itunes:block>no</itunes:block>
<itunes:explicit>false</itunes:explicit>



<item>
  <title>Der EuGH und der nicht enden-wollende Streit um die Vorratsdatenspeicherung</title>
  <link>https://chaosradio.de/cr291-vorratsdatenspeicherung</link>
  <pubDate>Sun, 09 Jun 2024 17:02:52 +0000</pubDate>
  <guid isPermaLink="false">podlove-2024-05-31t14:16:37+00:00-21f83868c0a8789</guid>
  <description><![CDATA[Im Grundsatz ist es zwar rechtswidrig, von allen Menschen ohne Anlass Telekommunikationsmetadaten aufzuzeichnen, aber die Vorratsdatenspeicherung ist in Deutschland trotzdem noch nicht vom Tisch. Nach einem aktuellen EuGH-Urteil wird die Massenüberwachung von IP-Adressen und Begleitdaten wieder neu diskutiert. Wir diskutieren das Urteil und erklären, was gespeichert werden soll.]]></description>
  <atom:link rel="http://podlove.org/deep-link" href="https://chaosradio.de/cr291-vorratsdatenspeicherung#" />
  
<enclosure url="https://chaosradio.de/podlove/file/2709/s/feed/c/mp3/cr291-vorratsdatenspeicherung.mp3" length="102871988" type="audio/mpeg"/>

  <itunes:duration>01:47:05</itunes:duration>
  <itunes:author>Chaos Computer Club Berlin</itunes:author>
  <itunes:subtitle>Warum die fast schon beerdigte Idee des massenhaften Wegspeicherns von Telekommunikationsdaten der gesamten Bevölkerung wieder Aufschwung bekommen könnte</itunes:subtitle>
  <itunes:title>Der EuGH und der nicht enden-wollende Streit um die Vorratsdatenspeicherung</itunes:title>
  <itunes:episode>291</itunes:episode>
  <itunes:episodeType>full</itunes:episodeType>
  <itunes:summary><![CDATA[Im Grundsatz ist es zwar rechtswidrig, von allen Menschen ohne Anlass Telekommunikationsmetadaten aufzuzeichnen, aber die Vorratsdatenspeicherung ist in Deutschland trotzdem noch nicht vom Tisch. Nach einem aktuellen EuGH-Urteil wird die Massenüberwachung von IP-Adressen und Begleitdaten wieder neu diskutiert. Wir diskutieren das Urteil und erklären, was gespeichert werden soll.]]></itunes:summary>
  
  <content:encoded><![CDATA[        <strong>CR291: Warum die fast schon beerdigte Idee des massenhaften Wegspeicherns von Telekommunikationsdaten der gesamten Bevölkerung wieder Aufschwung bekommen könnte</strong>
<p>Wir reden heute über ein Thema, das schon im Jahr 2005 im <a href="https://chaosradio.de/chaosradio_104">Chaosradio 104</a> (ab Minute 39) das erste Mal besprochen wurde: die Vorratsdatenspeicherung. Denn auch nach fast zwanzig Jahren ist die unendliche Geschichte der Massenspeicherung von Telekommunikationsmetadaten noch nicht zuende, im Gegenteil: Am 30. April 2024 erging ein weiteres Urteil des Europäischen Gerichtshofs. Darüber lohnt es sich zu sprechen.</p>
<p>Es ging in dem Urteil um eine auf IP-Adressen und Begleitdaten beschränkte Vorratsspeicherung und die Frage, ob eine französische Regelung gegen Filesharer mit dem EU-Recht vereinbar ist. Denn in Frankreich wurde vor Jahren im Streit um Urheberrechtsverletzungen der dortigen <a href="https://www.heise.de/news/Frankreich-Erster-Bericht-zu-Three-Strikes-und-Hadopi-1766605.html">Behörde Hadopi</a> erlaubt, verdächtige IP-Adressen mit Identitätsdaten von den Providern abzufragen. Es ging also nicht mehr um Vorratsdatenspeicherung bei schwerer Kriminalität, sondern um Menschen, die verdächtigt werden, Urheberverwertungsrechte zu verletzen.</p>
<div id="attachment_4460" style="width: 280px" class="wp-caption alignleft"><img decoding="async" aria-describedby="caption-attachment-4460" src="https://chaosradio.de/wp-content/uploads/2024/05/cr291.jpg" alt="cr-291-team" width="270" /><p id="caption-attachment-4460" class="wp-caption-text">Das Chaosradio-Team diesmal: Daniel, Marcus, Constanze und nibbler.</p></div>
<p>Das Urteil ist auch deswegen interessant, weil nach der Entscheidung des Gerichts der schwärende Streit um die Vorratsdatenspeicherung innerhalb der deutschen Ampel-Koalition weiterblubbert. Der FDP-Bundesjustizminister lehnt die verdachtslose Massendatensammlung zwar klar ab. Sein versprochener neuer Gesetzentwurf zum alternativen Quick-Freeze-Verfahren liegt aber noch immer nicht vor. Die SPD-Bundesinnenministerin hat sich hingegen für eine Vorratsdatenspeicherung von IP-Adressen samt zugehörigen Netzverbindungsdaten ausgesprochen.</p>
<p>Wenn ihr wissen wollt, worum es in dem EuGH-Urteil genau geht, hört rein! Wir reden auch darüber, wie bessere technische Lösungen statt der anlasslosen Massenüberwachung aussehen könnten. Was und wie wird technisch gespeichert? Und was hat das mit IT-Sicherheit zu tun? Was ist geschehen, seit der Justizminister nach einem EuGH-Urteil 2022 freudig ankündigte, <a href="https://twitter.com/MarcoBuschmann/status/1572134475584393218">die anlasslose Vorratsdatenspeicherung werde nun zügig und endgültig aus dem Gesetz</a> gestrichen? Darüber unterhält sich Marcus Richter mit seinen Gästen Daniel Moßbrucker, nibbler und Constanze Kurz im Chaosradio 291.</p>
      <p><strong>Referenzen</strong></p>

<ul>
      <li>
                      <a href="https://www.droemer-knaur.de/buch/daniel-mossbrucker-direkt-vor-unseren-augen-9783426279052">Das Buch von Daniel Moßbrucker: Direkt vor unseren Augen</a>
              </li>
</ul>


]]></content:encoded><psc:chapters xmlns:psc="http://podlove.org/simple-chapters" version="1.2">
<psc:chapter start="00:00:00.138" title="Einleitung und Vorstellung der Teilnehmer"/>
<psc:chapter start="00:18:48.463" title="Diskussion &#xFC;ber die Zunahme und Auswertung von Daten"/>
<psc:chapter start="00:21:43.588" title="Beispiel zur Veranschaulichung der Auswirkungen von Metadaten"/>
<psc:chapter start="00:24:14.265" title="Kritik an der Fixierung auf Vorratsdatenspeicherung"/>
<psc:chapter start="00:27:43.699" title="Europ&#xE4;ische Richtlinie und nationale Gesetze"/>
<psc:chapter start="00:33:36.164" title="Vorratsdatenspeicherung in Frankreich"/>
<psc:chapter start="00:37:23.716" title="Kippen der EU-Richtlinie, nationale Gesetze bestehen"/>
<psc:chapter start="00:40:04.503" title="Gesetz zur Vorratsdatenspeicherung in Deutschland"/>
<psc:chapter start="00:43:59.919" title="Speicherung von Daten im Mobilfunknetz"/>
<psc:chapter start="00:59:34.366" title="Technische Realisierung der Vorratsdatenspeicherung"/>
<psc:chapter start="01:10:16.477" title="Speicherfristen im EuGH-Urteil"/>
<psc:chapter start="01:13:42.583" title="Einfluss des EuGH-Urteils auf den politischen Diskurs"/>
<psc:chapter start="01:16:58.953" title="Angst vor Ausnahmen"/>
<psc:chapter start="01:23:55.155" title="Quick Freeze vs. Anschluss&#xFC;berwachung"/>
<psc:chapter start="01:27:22.701" title="Berufsgeheimnistr&#xE4;ger im Fokus"/>
<psc:chapter start="01:33:12.732" title="Lock-In-Falle f&#xFC;r Straft&#xE4;ter"/>
<psc:chapter start="01:38:59.940" title="Zukunft und politische Bewegungen"/>
<psc:chapter start="01:40:32.380" title="Zeit f&#xFC;r Evaluierung und Verabredungen"/>
<psc:chapter start="01:43:35.500" title="Outro: Systemabsturz - Verd&#xE4;chtig"/>
</psc:chapters>
<atom:contributor><atom:name>Marcus Richter</atom:name></atom:contributor>

<atom:contributor><atom:name>Constanze Kurz</atom:name></atom:contributor>

<atom:contributor><atom:name>nibbler</atom:name></atom:contributor>

<atom:contributor><atom:name>Daniel Moßbrucker</atom:name></atom:contributor>

<podcast:person img="https://chaosradio.de/wp-content/uploads/2018/11/cba8Tqi-_400x400.jpg">Marcus Richter</podcast:person>

<podcast:person img="https://chaosradio.de/wp-content/uploads/2023/04/cr-connstanze.jpg" role="guest">Constanze Kurz</podcast:person>

<podcast:person img="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJoLTYgdy02IiBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIj4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTUuMTIxIDE3LjgwNEExMy45MzcgMTMuOTM3IDAgMDExMiAxNmMyLjUgMCA0Ljg0Ny42NTUgNi44NzkgMS44MDRNMTUgMTBhMyAzIDAgMTEtNiAwIDMgMyAwIDAxNiAwem02IDJhOSA5IDAgMTEtMTggMCA5IDkgMCAwMTE4IDB6IiAvPgo8L3N2Zz4K" role="guest">nibbler</podcast:person>

<podcast:person img="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJoLTYgdy02IiBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIj4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTUuMTIxIDE3LjgwNEExMy45MzcgMTMuOTM3IDAgMDExMiAxNmMyLjUgMCA0Ljg0Ny42NTUgNi44NzkgMS44MDRNMTUgMTBhMyAzIDAgMTEtNiAwIDMgMyAwIDAxNiAwem02IDJhOSA5IDAgMTEtMTggMCA5IDkgMCAwMTE4IDB6IiAvPgo8L3N2Zz4K" role="guest">Daniel Moßbrucker</podcast:person>

  <podcast:transcript url="https://chaosradio.de/cr291-vorratsdatenspeicherung?podlove_transcript=webvtt" type="text/vtt" />
  <podcast:transcript url="https://chaosradio.de/cr291-vorratsdatenspeicherung?podlove_transcript=json_podcastindex" type="application/json" />
  <itunes:season>30</itunes:season>	</item>

</channel>
</rss>
`);
  expect(p.id).toBe('rss');
});

test("no feed auto discover", () => {
  let p = parserAutoDiscover(`<html><body>Hallo</body></html>`);
  expect(p).toBe(undefined);
});

test("Link auto discover: none", () => {
  const str = `<!DOCTYPE html>
<html lang="en-us">
<head>
</head>
<body>
    <p>content</p>
</body>
</html>`;

  let links = linkAutoDiscover(str, 'https://example.com');
  expect(links.length).toBe(0);
})

test("Link auto discover: Atom", () => {
  const str = `<!DOCTYPE html>
<html lang="en-us">
<head>
    <link href="/feed/devops.xml" rel="alternate" title="LZone Blog" type="application/atom+xml" >
</head>
<body>
    <p>content</p>
</body>
</html>`;

  let links = linkAutoDiscover(str, 'https://lzone.de');
  expect(links.length).toBe(1);
  expect(links[0]).toBe("https://lzone.de/feed/devops.xml")
})

test("Link auto discover: RSS", () => {
  const str = `<!DOCTYPE html>
<html lang="en-us">
<head>
    <link href="https://example.com/feed/devops.rss" rel="alternate" title="LZone Blog" type="application/rss+xml" >
</head>
<body>
    <p>content</p>
</body>
</html>`;

  let links = linkAutoDiscover(str, 'https://lzone.de');
  expect(links.length).toBe(1);
  expect(links[0]).toBe("https://example.com/feed/devops.rss")
})

test("Link auto discover: multiple links", () => {
  const str =`<!DOCTYPE html>
<html lang="en-us">
<head>
    <link href="feed/devops.rss" rel="alternate" title="LZone Blog" type="application/rss+xml" >
    <link href="/feed/devops.atom" rel="alternate" title="LZone Blog" type="application/atom+xml" >
</head>
<body>
    <p>content</p>
</body>
</html>`;

  let links = linkAutoDiscover(str, 'https://lzone.de/blog');
  expect(links.length).toBe(2);
  expect(links[0]).toBe("https://lzone.de/blog/feed/devops.rss")
  expect(links[1]).toBe("https://lzone.de/feed/devops.atom")
})

test("Link auto discover: slashdot", () => {
  const str = `<!-- html-header type=current begin -->
	
    <!DOCTYPE html>


    <html lang="en">
<body>
<link rel="alternate" title="Slashdot RSS" href="https://rss.slashdot.org/Slashdot/slashdotMain" type="application/rss+xml">
</body>
</html>`;

  let links = linkAutoDiscover(str, 'https://slashdot.org');
  expect(links.length).toBe(1);
  expect(links[0]).toBe("https://rss.slashdot.org/Slashdot/slashdotMain")
})