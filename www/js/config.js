// vim: set ts=4 sw=4:

import { fa } from "./vendor/chunks/mermaid.esm.min/chunk-ZKYS2E5M.mjs";

// app customization

export class Config {
    // trailing slash is important!
    static baseUrl = 'https://lzone.de/';

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
                'LZone Examples': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Examples/(.*)\\.md$'
                },
                'Video Tutorials': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Video Tutorials/(.*)\\.md$'
                },
                'Visual Ops': {
                    github: 'lwindolf/lzone-cheat-sheets',
                    filePattern: '^Visual Ops/(.*)\\.md$'
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

    // Apps for the app menu, for each URL the manifest.json is loaded
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

    // welcome text
    static welcome = `
        <p>
            LZone is a progressive web app by <a href="/consulting/en">Lars Windolf</a> that supports
            installing a ton of Sysadmin / DevOps / System Architecture related content
            so that you can search and read all of it in one place.
        </p>`;
}