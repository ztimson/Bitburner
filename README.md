# BitBurner - Scripts
These scripts are for playing the [open source](https://github.com/danielyxie/bitburner) game [BitBurner](https://danielyxie.github.io/bitburner/)

## Table of Contents
[[_TOC_]]

## Setup
The repository can be loaded into the game by doing the following:
1. Download the update script ingame: `wget https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/update.js scripts/update.js`
2. Run update script: `run scripts/update.js`

## Quick Start
```bash
# Start the node manager
run scripts/node-manager.js 8

# Chain the crawler, auto-pwner & miner to hack everything within 3 hops
run scripts/crawler.js 3 scripts/auto-pwn.js scripts/miner.js
```

## Scripts
### [auto-pwn.js](./scripts/auto-pwn.js) (WIP)
Automatically gains root on a target machine. After being pwned, the specified files will be coppied & ran.

It's recomended you use this in combination with `miner.js`

### [bruteforce.js](./scripts/bruteforce.js) (WIP)
Attacks target until security falls bellow threshold. Useful for throwing extra compute power & cracking a specific computer.

It's recommended you use any extra compute power on your home computer/servers to break strong servers & speed up the process.

### [crawler.js](./scripts/crawler.js) (WIP)
Scans the network to a desired depth & runs the specified script against targets.

It's recommended you use this in combination with `auto-pwn.js`.

### [miner.js](./scripts/miner.js) (WIP)
Will weaken, spoof & hack the target in a loop.

It's recommended you run this in combination with `auto-pwn.js` to gain root & run the miner on the remote machine.

### [node-manager.js](./scripts/node-manager.js)
**RAM:** 5.70 GB

Buy, upgrade & manage Hacknet nodes automatically.
```
[home ~/]> run scripts/node-manager.js --help
Running script with 1 thread(s), pid 128 and args: ["--help"].
/scripts/node-manager.js: 

Buy, upgrade & manage Hacknet nodes automatically.

Usage:	run node-manager.js [OPTIONS] LIMIT
	run node-manager.js --balance 1E6 4
	run node-manager.js --help

	LIMIT			 Limit the number of nodes the manager will buy

Options:
	-b --balance=num	 Prevent spending bellow this point
	-h --help		 Display help message
```

### [update.js](./scripts/update.js)
**RAM:** 1.60 GB

Automatically download the latest versions of all scripts using wget.
```
[home ~/]> run scripts/update.js
Running script with 1 thread(s), pid 142 and args: [].
/scripts/update.js: Downloading scripts:
/scripts/update.js: lib/arg-parser.js	[==================>] 100% 	 (15 MB/s)
/scripts/update.js: auto-pwn.js		[==================>] 100% 	 (22.3 MB/s)
/scripts/update.js: bruteforce.js	[==================>] 100% 	 (22 MB/s)
/scripts/update.js: crawler.js		[==================>] 100% 	 (26.2 MB/s)
/scripts/update.js: miner.js		[==================>] 100% 	 (10.8 MB/s)
/scripts/update.js: node-manager.js	[==================>] 100% 	 (14.6 MB/s)
/scripts/update.js: update.js		[==================>] 100% 	 (11.1 MB/s)
/scripts/update.js: ✅ Done!
```
