// vim: set ts=4 sw=4:

// Feed Autodiscovery
//
// 1.) link discovery in HTML documents
// 2.) type discovery in feed documents (parser factory)

import { XPath } from './xpath.js';
import { AtomParser } from './atom.js';
import { RSSParser } from './rss.js';
import { RDFParser } from './rdf.js';
import { JSONFeedParser } from './jsonfeed.js';

// Return a parser class matching the given document string or undefined
function parserAutoDiscover(str, url = "") {
    if (0 == str.indexOf('{')) {
        try {
            const obj = JSON.parse(str);
            if (obj.version && obj.version.startsWith("https://jsonfeed.org/version/"))
                return JSONFeedParser;
        } catch(e) {
            // ignore
        }
    }

    let parsers = [AtomParser, RSSParser, RDFParser];
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'application/xml');

    console.info(`auto discover ${url}`)
    for (let i = 0; i < parsers.length; i++) {
        for (let j = 0; j < parsers[i].autoDiscover.length; j++) {
            try {
                if (XPath.lookup(doc.firstChild, parsers[i].autoDiscover[j])) {
                    return parsers[i];
                }
            } catch(e) {
                // ignore
            }
        }
    }
    return undefined;
}

// for a given HTML document link return all feed links found
function linkAutoDiscover(str, baseURL) {
    let doc;
    
    // Try to parse as HTML
    try {
        doc = new DOMParser().parseFromString(str, 'text/html');
    } catch {
        console.info("Link discovery: could not parse HTML!");
    }

    if (!doc)
        return [];

    let results = [];

    // Try DOM based extraction (this fails on unclosed <link> tags)
    doc.head.querySelectorAll('link[rel="alternate"]').forEach((n) => {
        const type = n.getAttribute('type');
        if (!type)
                return
        if ((type === 'application/atom+xml') ||
            (type === 'application/rss+xml') ||
            (type === 'application/rdf+xml') ||
            (type === 'application/json') ||
            (type === 'text/xml'))
            results.push(n.getAttribute('href'));
    });

    // Fuzzy extract link tags from HTML string
    if(results.length === 0) {
        const linkPattern = /<link[^>]*>/g;
        const hrefPattern = /href="([^"]*)"/;
        const relPattern = /rel=["']alternate["']/;
        const typePattern = /type=["']([^"']+)["']/;

        let match;
        while ((match = linkPattern.exec(str)) !== null) {
                const relMatch = relPattern.exec(match[0]);
                const hrefMatch = hrefPattern.exec(match[0]);
                const typeMatch = typePattern.exec(match[0]);
                const type = typeMatch ? typeMatch[1] : null;
                const url = hrefMatch ? hrefMatch[1] : null;

                if (url && type && relMatch)
                        if ((type === 'application/atom+xml') ||
                            (type === 'application/rss+xml') ||
                            (type === 'application/rdf+xml') ||
                            (type === 'application/json') ||
                            (type === 'text/xml'))
                                results.push(url);
        }
    }

    results = results.map((href) => {
        if (!href.includes("://")) {
            var u = new URL(baseURL);
            if (href.startsWith('/'))
                u.pathname = href;
            else
                u.pathname += "/" + href;
            return u.href;
        } else {
            return href;
        }
    });

    return results;
}

export { parserAutoDiscover, linkAutoDiscover };