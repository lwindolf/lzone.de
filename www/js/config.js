// vim: set ts=4 sw=4:

// app customization

export class Config {
    static corsProxy = 'https://corsproxy.io/?url='; // CORS proxy (from Cloudflare) to use for fetching feeds

    // URLs with content indizes to add to the app
    //
    // These are basically Github repos with 
    // - an optional catalog JSON of other installable repos
    // - repo local markdown files (actual content)
    //
    // Each entry is added to the sidebar with the key as the display name
    // A search index is automatically created or a provided one is used
    //
    // Fields:
    // - `removable`(optional, default: true) if the group can be deactivated
    // - `install` (optional) Github repo definition to install, repo content will be automatically added to the sidebar
    // - `catalog` (optional) URL to a JSON file with additional repos that can be installed by the user
    static groups = {
        'Lars Windolf': {
            removable : true,
            install : {
                'About': {
                    github: 'lwindolf/blogs',
                    filePattern: '^About/(.*)\\.md$'
                }
            }
        },
        'Cheat Sheets': {
            removable : false,
            install : {
                'LZone Cheat Sheets': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Cheat Sheets/(.*)\\.md$'
                },
                'Video Tutorials': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Video Tutorials/(.*)\\.md$'
                }
            },
            catalog : {
                source  : 'https://raw.githubusercontent.com/lwindolf/lzone-cheat-sheets/master/extra-cheat-sheets.json',
                editUrl : 'https://github.com/lwindolf/lzone-cheat-sheets/blob/master/extra-cheat-sheets.json'
            }
        },
        'Feeds': {
            removable : false,
            defaultFeeds: [
                { title: "LZone Blog",       source: "https://lzone.de/feed/devops.xml" },
                { title: "Liferea Blog",     source: "https://lzone.de/liferea/blog/feed.xml" }
            ]
        }
    };

    // Apps for the 'Pinned Apps' web component, for each URL the manifest.json is loaded
    // to gather app name and icon
    static apps = {
        'Development': {
            'Regex101': {
                url         : 'https://regex101.com/',
                description : 'Test regex, get regex explanations'
            },
            'REPL JS': {
                url         : 'https://repljs.com/',
                favicon     : 'https://repljs.com/android-icon-192x192.png',
                description : 'Javascript console'
            },
            'HoppScotch.io': {
                url         : 'https://hoppscotch.io/',
                description : 'API request tester'
            },
            'ezgif': {
                url         : 'https://ezgif.com/',
                description : 'GIF, PNG, JPG image editor'
            }
        },
        'DevOps - Playgrounds': {
            'awk, sed, grep': {
                url          : 'https://sandbox.bio/playgrounds/',
                favicon      : 'https://sandbox.bio/favicon.ico',
                description  : 'Sandbox for awk, grep, sed'
            },
            'jq': {
                url          : 'https://play.jqlang.org/',
                favicon      : 'https://play.jqlang.org/favicon.svg',
                description  : 'Official jq playground'
            },
            'Helm': {
                url          : 'https://helm-playground.org/',
                favicon      : 'https://helm-playground.org/icons/favicon.ico',
                description  : 'Play with Helm charts'
            },
            'OPA Rego': {
                url          : 'https://play.openpolicyagent.org/',
                favicon      : 'https://play.openpolicyagent.org/images/favicon.ico',
                description  : 'Play with OPA Rego policies'
            },
            'Killercoda k8s': {
                url          : 'https://killercoda.com/playgrounds/kubernetes',
                favicon      : 'https://killercoda.com/favicon.ico',
                description  : 'Play with Kubernetes in your browser'
            },
            'Openshift Sandbox': {
                url          : 'https://console.redhat.com/openshift/sandbox',
                favicon      : 'https://access.redhat.com/webassets/avalon/g/favicon.ico',
                description  : 'Ad-hoc Openshift instances'
            },
            'iximiuz': {
                url          : 'https://labs.iximiuz.com/playgrounds',
                favicon      : 'https://iximiuz.com/favicon.ico',
                description  : 'VM, Docker, Podman, containerd, Ubuntu, k8s instances'
            }
        },
        'Networking': {
            'ipinfo.io': {
                url          : 'https://ipinfo.io/what-is-my-ip',
                favicon      : 'https://ipinfo.io/favicon.ico',
                description  : 'Get your public IP address'
            },
            'Qualys SSL Labs': {
                url          : 'https://www.ssllabs.com/ssltest/',
                favicon      : 'https://www.ssllabs.com/favicon.ico',
                description  : 'Test SSL/TLS configuration of a server'
            },
            'crt.sh': {
                url          : 'https://crt.sh/',
                favicon      : 'https://crt.sh/favicon.ico',
                description  : 'Certificate Transparency log search'
            },
            'mxtoolbox': {
                url          : 'https://mxtoolbox.com/',
                description  : 'Domain info lookup'
            },
            'Lookingglass': {
                url          : 'https://lookinglass.org/',
                description  : 'BGP AS looking class index'
            },
            'traceroute': {
                url          : 'https://www.uptrends.com/tools/traceroute',
                favicon      : 'https://www.uptrends.com/favicon.svg',
                description  : 'uptrends.com traceroute from 30+ locations'
            },
            'speedtest': {
                url          : 'https://www.speedtest.net/',
                favicon      : 'https://b.cdnst.net/images/favicons/favicon-180.png',
                description  : 'Test your internet connection speed'
            },
            'Cloudping': {
                url          : 'https://www.cloudping.cloud/',
                favicon      : 'https://cf.feitsui.com/icon/192x192.png',
                description  : 'HTTP Ping CDNs and AWS regions'
            },
            'Azure Speed Test': {
                url          : 'https://azurespeed.com/',
                favicon      : 'https://azurespeed.com/favicon.ico',
                description  : 'Test Azure region latency'
            },
            'GCP Ping': {
                url          : 'https://gcping.com/',
                favicon      : 'https://gcping.com/icon.662224a4.png',
                description  : 'Test GCP region latency'
            },
            'PeeringDB': {
                url          : 'https://www.peeringdb.com/',
                favicon      : 'https://www.peeringdb.com/s/2.68.0//favicon.ico',
                description  : 'PeeringDB is a database of networks, exchanges, and data centers'
            },
            'Snap Drop': {
                url          : 'https://snapdrop.net/',
                favicon      : 'https://www.snap-drop.net/images/favicon-96x96.png',
                description  : 'Share files with other devices in your network'
            }
        },
        'Diagram Tools': {
            'ASCII Flow': {
                url          : 'https://asciiflow.com',
                favicon      : 'https://asciiflow.com/public/favicon.png',
                description  : 'Draw ASCII boxes+arrows'
            },
            'Mermaid': {
                url          : 'https://mermaid.live',
                favicon      : 'https://mermaid.live/favicon.svg',
                description  : 'Draw Flowcharts, Sequence, ER, UML, Gantt, Mindmaps'
            },
            'draw.io': {
                url          : 'https://draw.io',
                favicon      : 'https://app.diagrams.net/favicon.ico',
                description  : 'Good old SVG drawing tool by Sun Microsystems'
            },
            'Wardley Maps': {
                url          : 'https://onlinewardleymaps.com/',
                favicon      : 'https://onlinewardleymaps.com/favicon.ico',
                description  : 'Value chain strategy maps'
            },
            'ArchiText': {
                url          : 'https://architext.dev/playground.html',
                favicon      : 'https://architext.dev/favicon.ico',
                description  : 'Draw ArchiMate style diagrams'
            },
            'nomnoml': {
                url          : 'https://nomnoml.com/',
                favicon      : 'https://nomnoml.com/favicon.png',
                description  : 'Draw UML diagrams'
            }
        },
        'Chat': {
            'Cinny': {
                url          : 'https://app.cinny.in/',
                favicon      : 'https://app.cinny.in/assets/favicon-5KspoOBy.ico',
                description  : 'Matrix client'
            },
            'KiwiIRC': {
                url          : 'https://kiwiirc.com/nextclient/',
                favicon      : 'https://kiwiirc.com/favicon.ico',
                description  : 'IRC client'
            }
        }
    };

    // Huggingface spaces for chat bot models
    // Note: first definition is always our default model
    static chatBotModels = {
        "Be-Bo/llama-3-chatbot_70b": async (client, prompt) => await client.predict("/chat", { message: prompt }),
        "Qwen/Qwen3-Demo": async (client, prompt) => await client.predict("/model_chat", [
            prompt,
            [],
            "You are a helpful assistant."
        ]),
        "Qwen/Qwen1.5-110B-Chat-demo": async (client, prompt) => await client.predict("/model_chat", [
            prompt,
            [],
            "You are a helpful assistant."
        ]),
        "huggingface-projects/gemma-2-9b-it": async (client, prompt) => await client.predict("/chat", {
            message: prompt,
            max_new_tokens: 1024,
            temperature: 0.6,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.2,
        }),
        "eswardivi/Phi-3-mini-128k-instruct": async (client, prompt) => await client.predict("/chat", [
            prompt,
            0.6,        // temperature
            true,       // sampling
            1024        // max token  
        ])
    };

    // Web components that will embed in the right side toolbox
    //
    // Fields:
    // - `import`   (mandatory) where to load the component from (import is relative to views/Checks.js)
    // - `embed`    (mandatory) HTML for embedding
    // - `settings` (optional)  HTML for embedding the settings component
    // - `enabled`  (mandatory) if the component is enabled by default
    static toolboxComponents = {
        'SaaS Multi Status': {
            import     : '../components/saas-multi-status/js/MultiStatusCloud.js',
            embed      : `<x-multistatus-cloud data-path="/js/components/saas-multi-status/" data-reduced="1">ERROR when embedding SaaS MultiStatus</x-multistatus-cloud>`,
            settings   : `<x-multistatus-settings data-path="/js/components/saas-multi-status/">ERROR when embedding SaaS MultiStatus Settings</x-multistatus-settings>`,
            enabled    : true
        },
        'DNS Change Detector': {
            import     : '../components/dns-checker/js/DnsChecker.js',
            embed      : `<x-dns-checker data-path="/js/components/dns-checker/">ERROR when embedding DNS Change Detector!</x-dns-checker>`,
            settings   : `<x-dns-checker-settings data-path="/js/components/dns-checker/">ERROR when embedding DNS Change Detector!</x-dns-checker-settings>`,
            enabled    : false
        },
        'Pinned Apps': {
            import     : '../components/pinned-apps/js/PinnedApps.js',
            embed      : `<x-pinned-apps>ERROR when embedding Pinned Apps</x-pinned-apps>`,
            settings   : `<x-pinned-apps-settings>ERROR when embedding Pinned Apps Settings</x-pinned-apps-settings>`,
            enabled    : true
        },
    };

    // welcome text
    static welcome = `
        <p>
            LZone is a progressive web app by <a href="https://lzone.de/consulting/en">Lars Windolf</a> that supports
            installing a ton of Sysadmin / DevOps / System Architecture related content
            so that you can search and read all of it in one place.
        </p>`;
}
