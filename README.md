# BitBurner - Scripts
These scripts are for playing the [open source](https://github.com/danielyxie/bitburner) game [BitBurner](https://danielyxie.github.io/bitburner/)

## Table of Contents
- [BitBurner - Scripts](#bitburner-scripts)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
  - [Scripts](#scripts)
    - [bruteforce.js (WIP)](#bruteforcejs-wip)
	- [crawler.js](#crawlerjs)
	- [miner.js](#minerjs)
	- [network-graph.js](#network-graphjs)
	- [node-manager.js](#node-managerjs)
	- [rootkit.js](#rootkitjs)
	- [update.js](#updatejs)

## Quick Start
```bash
# Download & run the update script ingame
wget https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/update.js scripts/update.js
run scripts/update.js

# Start the node manager with 8 nodes
run scripts/node-manager.js 8

# Chain the crawler, auto-pwner & miner to hack everything on the network
run scripts/crawler.js /scripts/auto-pwn.js {{TARGET}} /scripts/miner.js
```

## Scripts

### [bruteforce.js](./scripts/bruteforce.js) (WIP)
Attacks target until security falls bellow threshold. Useful for throwing extra compute power & cracking a specific computer.

### [crawler.js](./scripts/crawler.js)
**RAM:** 4.05 GB

Search the network for targets to execute a script against.
```
[home ~/]> run scripts/crawler.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/crawler.js: 

Search the network for targets to execute a script against.

Usage:	run crawler.js [OPTIONS] SCRIPT [ARGS]...
	run crawler.js --help

	SCRIPT			 Script to copy & execute
	ARGS			 Arguments for script. Forward the current target with: {{TARGET}}

Options:
	-c --cpu		 Number of CPU threads to use with script
	-d --depth		 Depth to scan to, defaults to 3
	-l --level		 Exclude targets with higher hack level, defaults to current hack level
	-p --ports		 Exclute targets with too many closed ports
	-h --help		 Display this help message
```

### [miner.js](./scripts/miner.js)
**RAM:** 2.45 GB

Weaken, Grow, Hack loop to "mine" target machine for money.
```
[home ~/]> run scripts/miner.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/miner.js: 

Weaken, Grow, Hack loop to "mine" target machine for money.

Usage:	run miner.js [TARGET]
	run miner.js --help

	TARGET			 Device to mine, defaults to current machine

Options:
	-h --help		 Display this help message
```

### [network-graph.js](./scripts/network-graph.js)
**RAM:** 3.85 GB

Scan the network for devices and display as an ASCII tree.
```
[home ~/]> run /scripts/network-graph.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/network-graph.js: 

Scan the network for devices and display as an ASCII tree:
 home
  ├─ n00dles (ROOTED)
  |   └─ max-hardware (80|1)
  |       └─ neo-net (50|1)
  ├─ foodnstuff (ROOTED)
  └─ sigma-cosmetics (ROOTED)

Usage:	run network-graph.js [OPTIONS] [TARGET]
	run network-graph.js --help

	TARGET			 Point to start scan from, defaults to current machine

Options:
	-d --depth		 Depth to scan to, defaults to 3
	-f --filter		 Display devices matching name
	-r --regex		 Display devices matching pattern
	-v --verbose		 Displays the required hack level & ports needed to root: (level|port)
	-h --help		 Display this help message
```

### [node-manager.js](./scripts/node-manager.js)
**RAM:** 5.70 GB

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.
```
[home ~/]> run scripts/node-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/node-manager.js: 

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.

Usage:	run node-manager.js [OPTIONS] [LIMIT]
	run node-manager.js --help

	LIMIT			 Limit the number of nodes the manager will buy, defaults to 8

Options:
	-b --balance		 Prevent spending bellow point
	-h --help		 Display this help message
```

### [rootkit.js](./scripts/rootkit.js)
**RAM:** 4.75 GB - 4.90 GB <small>(depending on un-commented programs)</small>

Automatically gain root on a target machine. A file can also be uploaded & executed.

Programs can be commented out to lower the cost of running.
```
[home ~/]> run scripts/rootkit.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/rootkit.js: 

Automatically gain root on a target machine. A file can also be uploaded & executed.

Usage:	run rootkit.js [OPTIONS] [TARGET] [SCRIPT] [ARGS]...
	run rootkit.js --help

	TARGET			 Target machine to root, defaults to current machine
	SCRIPT			 Script to copy & execute
	ARGS			 Arguments for script. Forward the current target with: {{TARGET}}

Options:
	-c --cpu		 Number of CPU threads to use with script
	-h --help		 Display this help message
```

### [update.js](./scripts/update.js)
**RAM:** 2.95 GB

Download the latest script updates from the repository using wget.
```
[home ~/]> run scripts/update.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/update.js: 

Download the latest script updates from the repository using wget.

Usage:	run update.js
	run update.js --help

	TARGET			Target device to update, defaults to current machine

Options:
	-h --help		 Display help message
```
