// vim: set ts=4 sw=4:

import { RDFParser } from '../www/js/feedreader/parsers/rdf';

test('Dublin Core', () => {
        // XML example from spec https://web.resource.org/rss/1.0/modules/dc/
        let feed = RDFParser.parse(`<?xml version="1.0" encoding="utf-8"?> 
        
        <rdf:RDF 
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns="http://purl.org/rss/1.0/"
        > 
        
          <channel rdf:about="http://meerkat.oreillynet.com/?_fl=rss1.0">
            <title>Meerkat</title>
            <link>http://meerkat.oreillynet.com</link>
            <description>Meerkat: An Open Wire Service</description>
            <dc:publisher>The O'Reilly Network</dc:publisher>
            <dc:creator>Rael Dornfest (mailto:rael@oreilly.com)</dc:creator>
            <dc:rights>Copyright © 2000 O'Reilly &amp; Associates, Inc.</dc:rights>
            <dc:date>2000-01-01T12:00+00:00</dc:date>
        
            <image rdf:resource="http://meerkat.oreillynet.com/icons/meerkat-powered.jpg" />
        
            <items>
              <rdf:Seq>
                <rdf:li resource="http://c.moreover.com/click/here.pl?r123" />
              </rdf:Seq>
            </items>
        
            <textinput rdf:resource="http://meerkat.oreillynet.com" />
        
          </channel>
        
          <image rdf:about="http://meerkat.oreillynet.com/icons/meerkat-powered.jpg">
            <title>Meerkat Powered!</title>
            <url>http://meerkat.oreillynet.com/icons/meerkat-powered.jpg</url>
            <link>http://meerkat.oreillynet.com</link>
          </image>
        
          <item rdf:about="http://c.moreover.com/click/here.pl?r123">
            <title>XML: A Disruptive Technology</title> 
            <link>http://c.moreover.com/click/here.pl?r123</link>
            <dc:description>XML is placing increasingly heavy...</dc:description>
            <dc:publisher>The O'Reilly Network</dc:publisher>
            <dc:creator>Simon St.Laurent (mailto:simonstl@simonstl.com)</dc:creator>
            <dc:rights>Copyright © 2000 O'Reilly &amp; Associates, Inc.</dc:rights>
            <dc:subject>XML</dc:subject>
          </item> 
        
          <textinput rdf:about="http://meerkat.oreillynet.com">
            <title>Search Meerkat</title>
            <description>Search Meerkat's RSS Database...</description>
            <name>s</name>
            <link>http://meerkat.oreillynet.com/</link>
          </textinput>
        
        </rdf:RDF>`);
    
        expect(feed.error).toBe(undefined);
        expect(feed.newItems.length).toBe(1);
        expect(feed.newItems[0].description).toBe(`XML is placing increasingly heavy...`);   
        // with no date given date should be similar to current date
        expect(Math.floor(Date.now() / 10000) - Math.floor(feed.newItems[0].time / 10000)).toBe(0)
    });

test('content:encoded', () => {
        let feed = RDFParser.parse(`<?xml version="1.0" encoding="utf-8"?> 
     
     <rdf:RDF 
       xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
       xmlns:content="http://purl.org/rss/1.0/modules/content/"
       xmlns="http://purl.org/rss/1.0/"
     > 
     
       <channel rdf:about="http://example.org/rss.rdf">
         <title>Example Feed</title>
         <link>http://www.example.org</link>
         <description>Simply for the purpose of demonstration.</description>
     
         <items>
           <rdf:Seq>
             <rdf:li resource="http://example.org/item/" />
           </rdf:Seq>
         </items>
         
       </channel>
     
       <item rdf:about="http://example.org/item/">
         <title>The Example Item</title> 
         <link>http://example.org/item/</link>
         <content:encoded><![CDATA[<p>What a <em>beautiful</em> day!</p>]]></content:encoded>
       </item> 
     </rdf:RDF>`);
     
        expect(feed.error).toBe(undefined);
        expect(feed.newItems.length).toBe(1);
        expect(feed.newItems[0].description).toBe(`<p>What a <em>beautiful</em> day!</p>`);
     });

test('media:content', () => {
      let feed = RDFParser.parse(`<?xml version="1.0" encoding="utf-8"?> 
   
   <rdf:RDF 
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns="http://purl.org/rss/1.0/"
   > 
   
     <channel rdf:about="http://example.org/rss.rdf">
       <title>Example Feed</title>
       <link>http://www.example.org</link>
       <description>Simply for the purpose of demonstration.</description>
   
       <items>
         <rdf:Seq>
           <rdf:li resource="http://example.org/item/" />
         </rdf:Seq>
       </items>
       
     </channel>
   
     <item rdf:about="http://example.org/item/">
       <title>The Example Item</title> 
       <link>http://example.org/item/</link>
       <media:content 
                        url="http://www.foo.com/movie.mov" 
                        fileSize="12216320" 
                        type="video/quicktime"
                        medium="video"
                        isDefault="true" 
                        expression="full" 
                        bitrate="128" 
                        framerate="25"
                        samplingrate="44.1"
                        channels="2"
                        duration="185" 
                        height="200"
                        width="300" 
                        lang="en" />
     </item> 
   </rdf:RDF>`);
   
      expect(feed.error).toBe(undefined);
      expect(feed.newItems.length).toBe(1);
      expect(feed.newItems[0].media.length).toBe(1);
      expect(feed.newItems[0].media[0].url).toBe("http://www.foo.com/movie.mov");
      expect(feed.newItems[0].media[0].mime).toBe("video/quicktime");
      expect(feed.newItems[0].media[0].length).toBe(185);
   });
   