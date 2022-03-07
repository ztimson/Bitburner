# BitBurner - Scripts
These scripts are for playing the [open source](https://github.com/danielyxie/bitburner) game [BitBurner](https://danielyxie.github.io/bitburner/)

## Table of Contents
[[_TOC_]]

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
### [auto-pwn.js](./scripts/auto-pwn.js)
**RAM:** 4.75 GB

Automatically gain root on a target machine. Optionaly after being rooted, a file can be coppied & executed.
```
[home ~/]> run scripts/auto-pwn.js --help
Running script with 1 thread(s), pid 161 and args: ["--help"].
/scripts/auto-pwn.js: 

Automatically gain root on a target machine. Optionaly after being rooted, a file can be coppied & executed.

Usage:	run auto-pwn.js [TARGET] [SCRIPT] [ARGS]...
	run auto-pwn.js --help

	TARGET			 Target machine to root. Defaults to localhost
	SCRIPT			 Script to copy & execute
	ARGS			 Aditional arguments for SCRIPT. Forward the target with "{{TARGET}}"

Options:
	-t --threads=num	 Set number of threads for script
	-h --help		 Display help message
```

### [bruteforce.js](./scripts/bruteforce.js) (WIP)
Attacks target until security falls bellow threshold. Useful for throwing extra compute power & cracking a specific computer.

### [crawler.js](./scripts/crawler.js) (WIP)
**RAM:** 3.05 GB

Search the network for targets to execute a script against.
```
[home ~/]> run scripts/crawler.js --help
Running script with 1 thread(s), pid 163 and args: ["--help"].
/scripts/crawler.js: 

Search the network for targets to execute a script against.

Usage:	run crawler.js [OPTIONS] SCRIPT [ARGS]...
	run crawler.js --help

	SCRIPT			 Script to copy & execute
	ARGS			 Aditional arguments for SCRIPT. Forward the target with "{{TARGET}}"

Options:
	-d --depth=num		 Number of network hops. Defaults to 3
	-l --level=num		 Exclude targets with a high hacking level. Defaults to hack level, 0 to disable
	-p --ports=num		 Exclute targets with too many closed ports
	-t --threads=num	 Set number of threads for script
	-h --help		 Display help message
```

### [miner.js](./scripts/miner.js)
**RAM:** 2.35 GB

Weaken, spoof & hack the target in a loop for money.
```
[home ~/]> run scripts/miner.js --help
Running script with 1 thread(s), pid 165 and args: ["--help"].
/scripts/miner.js: 

Weaken, spoof & hack the target in a loop for money.

Usage:	run miner.js [TARGET]
	run miner.js --help

	TARGET			 Target to mine. Defaults to localhost

Options:
	-h --help		 Display help message
```

### [network-graph.js](./scripts/network-graph.js)
**RAM:** 3.85 GB

Scan the network for devices and display as an ASCII tree.
```
[home ~/]> run /scripts/network-graph.js --help
Running script with 1 thread(s), pid 138 and args: ["--help"].
/scripts/network-graph.js: 

Scan the network for devices and display as an ASCII tree:
 home
  ├─ n00dles (ROOTED)
  |   └─ max-hardware (80|1)
  |       └─ neo-net (50|1)
  ├─ foodnstuff (ROOTED)
  └─ sigma-cosmetics (ROOTED)

Usage:	run network-graph.js [OPTIONS] 
	run network-graph.js --help

Options:
	-d --depth		 Depth to scan to, defaults to 3
	-f --filter		 Display path to single device
	-s --start		 Point to start scan from, defaults to current machine
	-v --verbose		 Displays the required hack level & ports needed to root: (level|port)
	-h --help		 Display this help message
```

### [node-manager.js](./scripts/node-manager.js)
**RAM:** 5.70 GB

Buy, upgrade & manage Hacknet nodes automatically.
```
[home ~/]> run scripts/node-manager.js --help
Running script with 1 thread(s), pid 166 and args: ["--help"].
/scripts/node-manager.js: 

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.

Usage:	run node-manager.js [OPTIONS] LIMIT
	run node-manager.js --balance 1E6 4
	run node-manager.js --help

	LIMIT			 Limit the number of nodes the manager will buy

Options:
	-b --balance=num	 Prevent spending bellow this point
	-h --help		 Display help message
```

### [update.js](./scripts/update.js)
**RAM:** 2.60 GB

Automatically download the latest versions of all scripts using wget.
```
[home ~/]> run scripts/update.js --help
Running script with 1 thread(s), pid 167 and args: ["--help"].
/scripts/update.js: 

Automatically download the latest versions of all scripts using wget.

Usage:	run update.js
	run update.js --help

Options:
	-h --help		 Display help message
```
