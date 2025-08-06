// vim: set ts=4 sw=4:

import { RDFParser } from '../www/js/feedreader/parsers/rdf';

test('rss 1.0 parse', () => {
        let feed = RDFParser.parse(`<?xml version="1.0"?>
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

        <item rdf:about="http://xml.com/pub/2000/08/09/rdfdb/index.html">
                <title>Putting RDF to Work</title>
                <link>http://xml.com/pub/2000/08/09/rdfdb/index.html</link>
                <dc:date>2023-09-17T11:34:00+00:00</dc:date>
                <description>Tool and API support for the Resource Description Framework ...</description>
        </item>
</rdf:RDF>`);

        expect(feed.error).toBe(undefined);
        expect(feed.title).toBe('XML.com');
        expect(feed.homepage).toBe('http://xml.com/pub');
        expect(feed.newItems.length).toBe(2);
        expect(feed.newItems[0].description).toBe(`Processing document inclusions with general XML tools can be ...`);
        expect(feed.newItems[0].source).toBe('http://xml.com/pub/2000/08/09/xslt/xslt.html');
        expect(feed.newItems[0].time).toBe(1694950440);
});