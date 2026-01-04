// vim: set ts=4 sw=4:

// Favicon discovery in feed homepages

// For now for simplicity NewsAgain 
// - does not download favicons, but only persists the discovered link. 
//   (caching could be done by web workers...)
// - does discovery of URLs only once
//
// For simplicity discovery is only done
//
// 1.) in the feed parsed
// 2.) on the homepage HTML of the feed
//
// HTML links are analyzed by quality of the links
//
// 1.) links guaranteeing certain sizes >128px
// 2.) links possibly pointing to good icons
// 3.) links poiting to smaller icons

import { XPath } from './xpath.js';

class Favicon {
    // we prefer XPath
    static searches = [
        { type: "MS Tile",          order: 2, xpath: "/html/head/meta[@name='msapplication-TileImage']/@href" },
        { type: "Safari Mask",      order: 3, xpath: "/html/head/link[@rel='mask-icon']/@href" },
        { type: "large icon",       order: 0, xpath: "/html/head/link[@rel='icon' or @rel='shortcut icon'][@sizes='192x192' or @sizes='144x144' or @sizes='128x128']/@href" },
        { type: "small icon",       order: 5, xpath: "/html/head/link[@rel='icon' or @rel='shortcut icon'][@sizes]/@href" },
        { type: "favicon",          order: 8, xpath: "/html/head/link[@rel='icon' or @rel='shortcut icon' or @rel='SHORTCUT ICON'][not(@sizes)]/@href" },
        { type: "Apple touch",      order: 1, xpath: "/html/head/link[@rel='apple-touch-icon' or @rel='apple-touch-icon-precomposed'][@sizes='180x180' or @sizes='152x152' or @sizes='144x144' or @sizes='120x120']/@href" },
        { type: "Apple no size",    order: 6, xpath: "/html/head/link[@rel='apple-touch-icon' or @rel='apple-touch-icon-precomposed'][not(@sizes)]/@href" },
        { type: "Apple small",      order: 7, xpath: "/html/head/link[@rel='apple-touch-icon' or @rel='apple-touch-icon-precomposed'][@sizes]/@href" }
    ].sort((a, b) => (a.order - b.order));

    // but can fallback to regex fuzzy matches
    static fuzzyExtraction = [
        { type: "MS Tile",          order: 2, matchRegex: /<meta\s+name=.msapplication-TileImage.\s+[^>]+>/ },
        { type: "Safari Mask",      order: 3, matchRegex: /<link\s+rel=.mask-icon.\s+[^>]+>/ },
        { type: "large icon",       order: 0, matchRegex: /<link\s+rel=.icon.\s+[^>]+sizes=['"](192x192|144x144|128x128)['"]\s+[^>]+>/ },
        { type: "small icon",       order: 5, matchRegex: /<link\s+rel=.icon.\s+[^>]+sizes=[^>]+>/ },
        { type: "favicon",          order: 8, matchRegex: /<link\s+rel=.icon.\s+[^>]+>/ },
        { type: "Apple touch",      order: 1, matchRegex: /<link\s+rel=.apple-touch-icon.\s+[^>]+sizes=['"](180x180|152x152|144x144|120x120)['"]>/ },
        { type: "Apple no size",    order: 6, matchRegex: /<link\s+rel=.apple-touch-icon.\s+[^>]+>/ },
        { type: "Apple small",      order: 7, matchRegex: /<link\s+rel=.apple-touch-icon.\s+[^>]+sizes=[^>]+>/ }
    ].sort((a, b) => (a.order - b.order));

    static hrefExtractRegex = new RegExp(`href=['"]([^'"]+)['"]`);

    static async discover(url, allowCorsProxy = false) {
        let html;
        let result;

        console.log(`favicon discovery for ${url}`);

        try {
            // Parse HTML
            let doc = await window.fetch(url, { allowCorsProxy })
                .then((response) => response.text())
                .then((str) => {
                    html = str;
                    console.log("favicon discovery got HTML ", html);
                    return new DOMParser().parseFromString(html, 'text/html');
                });

            if(doc) {
                console.log("favicon discovery HTML parse success");

                // DOCTYPE node is first child when parsing HTML5, we need to 
                // find the <html> root node in this case
                let root = doc.firstChild;
                while(root && root.nodeName.toUpperCase() !== 'HTML') {
                    root = root.nextSibling;
                }

                if(root) {
                    console.log("favicon discovery root element found");

                    // Check all XPath search pattern
                    for(let i = 0; i < Favicon.searches.length; i++) {
                        result = XPath.lookup(root, Favicon.searches[i].xpath)
                        if(result)
                            break;
                    }
                }
            }
        } catch(e) {
            console.log("favicon discovery via XPath failed", e);
        }

        if (!result && html) {
            console.log("favicon discovery via regex fuzzy matches");
            for(let i = 0; i < Favicon.fuzzyExtraction.length; i++) {
                console.log("favicon discovery test for", Favicon.fuzzyExtraction[i].type);
                let match = Favicon.fuzzyExtraction[i].matchRegex.exec(html);
                if(match) {
                    console.log("favicon discovery match for ", match[0]);
                    match = Favicon.hrefExtractRegex.exec(match[0]);
                    result = match ? match[1] : null;
                    break;
                }
            }
        }

        // If nothing found see if there is a 'favicon.ico' on the homepage
        if(!result)
            result = await fetch(url + '/favicon.ico', { allowCorsProxy })
                .then((response) => response.text())
                .then(() => url + '/favicon.ico');

        if(result) {
            console.log(`favicon discovery found '${result}'`);
            if(result.includes('://'))
                return result;
            else {
                // FIXME: support base URL + absolute path (e.g. for rbb24 favicon)
                if(result.startsWith('/'))
                    return url + result;
                else
                    return url + '/' + result;
            }
        } else {
            console.log("favicon discovery nothing found");
        }
    }
}

export { Favicon };