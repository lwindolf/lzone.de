// vim: set ts=4 sw=4:

import { ChatView } from "./views/Chat.js";

// Poor man helper functions, cheaply implemented

export class Commands {
	static commands = {
		help: {
			syntax: 'help',
			summary: 'Show this help again\n',
			func: () => this.help()
		},
		base64: {
			syntax: 'base64 [-d] <string>',
			summary: 'string <-> base64',
			func: (cmd) => {
				if (cmd[1] !== '-d') {
					return btoa(cmd[2]);
				} else {
					return atob(cmd[1]);
				}
			}
		},
		cw: {
			syntax: 'cw',
			summary: 'Print calendar weeks',
			func: () => {
				const d = new Date();
				const getWeek = (date) => {
					const d = new Date(date);
					// Add 3 days to move to Thursday (ISO standard)
					d.setDate(d.getDate() + 3);
					return Math.ceil(Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) / 7);
				}

				return `Current week is ${getWeek(d)}\n\nFollowing weeks are:\n` +
					Array.from({ length: 10 }, (_, index) => index + 1)
						.map((i) => {
							const m = new Date(d);
							m.setDate(m.getDate() + (1 - m.getDay()));	// set to Monday
							m.setDate(m.getDate() + 7*i)				// skip weeks
							return `week ${getWeek(m)} --- Monday ${m.toLocaleDateString()}`;
						})
						.join('\n');
			}
		},
		date: {
			syntax: 'date <epoch>',
			summary: 'epoch -> date',
			func: (cmd, paramStr) => new Date(parseInt(paramStr))
		},
		dig: {
			syntax: 'dig [<type>] <domain>',
			summary: 'Simple Cloudflare DoH lookup',
			func: async (cmd) => {
				let record = cmd[2] ? cmd[1] : 'A';
				let domain = cmd[2] ? cmd[2] : cmd[1];
				const result = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${record}`, {
					headers: {
						'Accept': 'application/dns-json'
					}
				}).then((r) => r.json());
				return JSON.stringify(result, null, 2);
			}
		},
		epoch: {
			syntax: 'epoch <date>',
			summary: 'date -> epoch',
			func: (cmd, paramStr) => {
				const result = new Date(paramStr).getTime();
				return `Epoch [ms] : ${result}\nUnix epoch : ${result / 1000}`;
			}
		},
		ip: {
			syntax: 'ip',
			summary: 'Print IP (https://ifconfig.me)',
			func: async () => {
				const r = await fetch('https://ifconfig.me/all.json');
				const json = await r.json();
				console.log(json)
				return json.ip_addr;
			}
		},
		ipcalc: {
			syntax: 'ipcalc <CIDR>',
			summary: 'Calculate address range',
			func: (cmd) => {
				const result = this.#getIpRangeFromAddressAndNetmask(cmd[1]);
				return `Base      : ${result[0]}\nBroadcast : ${result[1]}`;
			}
		},
		mkpasswd: {
			syntax: 'mkpasswd [<len>] [<chars>]',
			summary: 'Random password',
			func: (cmd) => this.#secpw(
				cmd[1] ? parseInt(cmd[1]) : undefined,
				cmd[2]
			)
		},
		qr: {
			syntax: 'qr <URL>',
			summary: 'Create QR code',
			func: (cmd, paramStr) => {
				ChatView.addHTMLResult('$ '+cmd.join(' '), `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURI(paramStr)}"/>`);
				return "";
			}
		},
		si: {
			syntax: 'si <value MB>',
			summary: 'Print power 2 values',
			func: (cmd) => {
				const v = parseInt(cmd[1]);
				return `${v * 1024} KiB\n${v / 1024} GiB\n${v / 1024 / 1024} TiB`;
			}
		},
		weather: {
			syntax: 'weather',
			summary: 'Embed weather map',
			func: () => {
				document.getElementById('CommandsViewEmbed')?.remove();
				ChatView.addHTMLResult('$ weather', '<div id="CommandsViewEmbed">Loading weather widget...</div>');
				navigator.geolocation.getCurrentPosition((position) => {
					const crd = position.coords;

					console.log("Your current position is:");
					console.log(`Latitude : ${crd.latitude}`);
					console.log(`Longitude: ${crd.longitude}`);
					console.log(`More or less ${crd.accuracy} meters.`);

					const lat = position.coords.latitude;
					const lon = position.coords.longitude;
					document.getElementById('CommandsViewEmbed').innerHTML = `<iframe frameborder="0" src="https://imweather.com/widget/map?lat=${lat}&lng=${lon}&z=6.20&model=nowcast&element=radar_obs&values=true" style="height:400px;width:100%;max-width:640px;"></iframe>`;
				}, (err) => {
					document.getElementById('CommandsViewEmbed').innerHTML = `Fetching Geo position failed (Error ${err.code}: ${err.message})!`;
				}, {
					enableHighAccuracy: false,
					timeout: 1000,
					maximumAge: 0,
				});
				return undefined;
			}
		},
		webamp: {
			syntax: 'webamp',
			summary: 'Embed music player',
			func: () => {
				if(document.getElementById('webampApp')) {
					window.webamp.reopen();
				} else {
					const div = document.createElement("div");
					div.id = 'webampApp';
					document.body.appendChild(div);

					import("https://unpkg.com/webamp").then(() => {
						const app = document.getElementById("webampApp")
						// eslint-disable-next-line no-undef
						window.webamp = new Webamp();
						window.webamp.renderWhenReady(app);
					});
				}
				return "Opening webamp.";
			}
		}
	};

	static isValid = (str) => Commands.commands.hasOwnProperty(str.split(/\s+/)[0])
	static help = () => 'Syntax:\n\n' + 
						'    <query>             # Search all cheat sheets\n' +
						'    <query>?            # Perform a chat bot query\n' +
						'    ?<query>            # Perform a chat bot query\n' +
						'    !<command>          # Run a command\n\n' +
						'Commands:\n\n' +
						Object.entries(Commands.commands).map((e) => {
							return '    !' + e[1].syntax + ' '.repeat(30 - e[1].syntax.length) + ' # ' + e[1].summary;
						}).join('\n');
	
	// Slightly modified from https://github.com/hannob/secpw/blob/main/secpw.js
	/* (c) Hanno Boeck, 0BSD license, https://password.hboeck.de/ */
	static #secpw(pwlen, pwchars) {
		if (pwlen === undefined) {
			pwlen = 32;
		} else if (!Number.isInteger(pwlen) || pwlen <= 0) {
			throw new Error("len must be a positive integer");
		}

		if (pwchars === undefined) {
			pwchars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789äüöÄÜÖ_-+=/°^`'\"|#@!.";
		} else if (typeof pwchars !== "string") {
			throw new Error("chars must be a string");
		} else if (pwchars.length > 256) {
			throw new Error("chars must be <= 256");
		}

		const limit = 256 - (256 % pwchars.length);

		let passwd = "";
		let randval;
		for (let i = 0; i < pwlen; i++) {
			do {
				randval = window.crypto.getRandomValues(new Uint8Array(1))[0];
			} while (randval >= limit);
			passwd += pwchars[randval % pwchars.length];
		}
		return passwd;
	}

	// https://stackoverflow.com/questions/32978982/calculate-ip-range-from-ip-string-equal-to-x-x-x-x-x
	static #getIpRangeFromAddressAndNetmask(str) {
		var part = str.split("/"); // part[0] = base address, part[1] = netmask
		var ipaddress = part[0].split('.');
		var netmaskblocks = ["0", "0", "0", "0"];
		if (!/\d+\.\d+\.\d+\.\d+/.test(part[1])) {
			// part[1] has to be between 0 and 32
			netmaskblocks = ("1".repeat(parseInt(part[1], 10)) + "0".repeat(32 - parseInt(part[1], 10))).match(/.{1,8}/g);
			netmaskblocks = netmaskblocks.map(function (el) { return parseInt(el, 2); });
		} else {
			// xxx.xxx.xxx.xxx
			netmaskblocks = part[1].split('.').map(function (el) { return parseInt(el, 10) });
		}
		// invert for creating broadcast address (highest address)
		var invertedNetmaskblocks = netmaskblocks.map(function (el) { return el ^ 255; });
		var baseAddress = ipaddress.map(function (block, idx) { return block & netmaskblocks[idx]; });
		var broadcastaddress = baseAddress.map(function (block, idx) { return block | invertedNetmaskblocks[idx]; });
		return [baseAddress.join('.'), broadcastaddress.join('.')];
	}

	static async run(str) {
		try {
			const cmd = str.split(/\s/);
			const paramStr = str.substring(cmd[0].length);
			return await Commands.commands[cmd[0]].func(cmd, paramStr);
		} catch (e) {
			return `ERROR: Exception (${e})`;
		}
	}
}