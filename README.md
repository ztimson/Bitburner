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
Manages the specified number of nodes buying any if they don't exist.

It's recommended you run this from your home computer, it useses 5.6 GB of RAM.
```
Usage: run node-manager.js [OPTION] LIMIT

	Limit - Limit the number of nodes the script will buy

Options:
	Help - Displays this help message
	Balance - Prevent spending bellow this point
```

### [update.js](./scripts/update.js)
Automaticlly downloads all the scripts in this repo using the in-game `wget`.
```
Usage: run update.js
```
