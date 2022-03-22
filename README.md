# BitBurner - Scripts
These scripts are for playing the [open source](https://github.com/danielyxie/bitburner) game [BitBurner](https://danielyxie.github.io/bitburner/)

## Table of Contents
- [BitBurner - Scripts](#bitburner-scripts)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
- [Scripts](#scripts)
    - [botnet-manager.js (WIP)](#botnet-managerjs-wip)
    - [connect.js](#connectjs)
    - [copy.js](#copyjs)
    - [crawler.js](#crawlerjs)
    - [find-target.js](#find-targetjs)
    - [hacknet-manager.js](#hacknet-managerjs)
    - [miner.js](#minerjs)
    - [network-graph.js](#network-graphjs)
    - [rootkit.js](#rootkitjs)
    - [update.js](#updatejs)

## Quick Start

```bash
# Download the update script in-game & run it
wget https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/update.js scripts/update.js
run scripts/update.js # Repeat to pull the latest

# View the network
run scripts/network-graph.js --verbose
run scripts/netowkr-graph.js -v --filter CSEC # Find path to a specific device

# Start the node manager & cap it at 8 nodes
run scripts/node-manager.js 8

# Chain the crawler & rootkit to root all devices on the network
run scripts/crawler.js --not-rooted /scripts/rootkit.js {{TARGET}}

# Find the most profitable server & use the crawler to deploy miners on the network targeting it
run scripts/find-target.js # Output: n00dles
run scriipts/crawler.js --rooted /scripts/miner.js n00dles

# Install backdoor on CSEC
run scripts/rootkit.js CSEC
run scripts/connect.js CSEC
backdoor
```

Learn more about the [availible scripts](#scripts) bellow or pass the `--help` flag to any of the included scripts in-game.

## Scripts

### [botnet-manager.js (WIP)](./scripts/botnet-manager.js)
**RAM:** ?.?? GB

Connect & manage a network of devices to launch distributed attacks.
```
[home ~/]> run /scripts/botnet-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/botnet-manager.js:

```

### [connect.js](./scripts/connect.js)
**RAM:** 1.85 GB

Search the network for a device and connect to it.
```
[home ~/]> run /scripts/connect.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/connect.js: 

Search the network for a device and connect to it.

Usage:	run connect.js DEVICE
	run connect.js --help

	DEVICE			 Device to connect to

Options:
	-h --help		 Display this help message
```

### [copy.js](./scripts/copy.js)
**RAM:** 3.50 GB

Copy a file/script to a device along with any dependencies.
```
[home ~/]> run scripts/copy.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/copy.js: 

Copy a file/script to a device along with any dependencies.

Usage:	run copy.js [OPTIONS] FILE DEVICE
	run copy.js --help

	FILE			 File to copy
	DEVICE			 Device to copy file(s) to

Options:
	-d --no-deps		 Skip copying dependencies
	-s --silent		 Surpress program output
	-h --help		 Display this help message
```

### [crawler.js](./scripts/crawler.js)
**RAM:** 4.15 GB

Search the network for devices to execute a script against.
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
	-k --kill		 Kill all scripts running on device
	--level			 Exclude targets with higher hack level, defaults to current hack level
	-l --local		 Execute on current machine otherwise execute on remote device
	-r --rooted		 Filter to devices that have been rooted
	-n --not-rooted		 Filter to devices that have not been rooted
	-p --ports		 Exclude targets with too many closed ports
	-s --silent		 Suppress program output
	-v --verbose		 Display the device names in the final report
	-h --help		 Display this help message
```

### [find-target.js](./scripts/find-target.js)
**RAM:** 6.00 GB

Scan the network for the best device(s) to mine.
```
[home ~/]> run scripts/find-target.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/find-target.js: 

Scan the network for the best device(s) to mine.

Usage:	run find-target.js [OPTIONS] 
	run find-target.js --help

Options:
	-c --count		 Number of devices to return in order from best to worst
	-r --rooted		 Filter to devices that have been rooted
	-n --not-rooted		 Filter to devices that have not been rooted
	-v --verbose		 Display the estimated income per minute per core
	-h --help		 Display this help message
```

### [hacknet-manager.js](./scripts/hacknet-manager.js)
**RAM:** 5.70 GB

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.
```
[home ~/]> run scripts/hacknet-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/hacknet-manager.js: 

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.

Usage:	run hacknet-manager.js [OPTIONS] [LIMIT]
	run hacknet-manager.js --help

	LIMIT			 Limit the number of nodes the manager will buy, defaults to 8

Options:
	-b --balance		 Prevent spending bellow point
	-s --sleep		 Amount of time to wait between purchases, defaults to 1 (second)
	-h --help		 Display this help message
```

### [miner.js](./scripts/miner.js)
**RAM:** 2.45 GB

Weaken, Grow, Hack loop to "mine" device for money. Tail for live updates.
```
[home ~/]> run scripts/miner.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/miner.js: 

Weaken, Grow, Hack loop to "mine" device for money. Tail for live updates.

Usage:	run miner.js [DEVICE]
	run miner.js --help

	DEVICE			 Device to mine, defaults to current machine

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

Usage:	run network-graph.js [OPTIONS] [DEVICE]
	run network-graph.js --help

	DEVICE			 Point to start scan from, defaults to current machine

Options:
	-d --depth		 Depth to scan to
	-f --filter		 Filter to device matching name
	-e --regex		 Filter to devices matching pattern
	-r --rooted		 Filter to devices that have been rooted
	-n --not-rooted		 Filter to devices that have not been rooted
	-v --verbose		 Display the required hack level & number of ports to root: (level|port)
	-h --help		 Display this help message
```

### [rootkit.js](./scripts/rootkit.js)
**RAM:** 4.80 GB - 4.95 GB <small>(depending on un-commented programs)</small>

Automatically gain root on a target machine. A file can also be uploaded & executed.

Programs can be commented out to lower the cost of running.
```
[home ~/]> run scripts/rootkit.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/rootkit.js: 

Automatically gain root access to a device. A file can also be uploaded & executed.

Usage:	run rootkit.js [OPTIONS] [DEVICE] [SCRIPT] [ARGS]...
	run rootkit.js --help

	DEVICE			 Device to root, defaults to current machine
	SCRIPT			 Script to copy & execute
	ARGS			 Arguments for script. Forward the current target with: {{TARGET}}

Options:
	-c --cpu		 Number of CPU threads to use with script
	-s --silent		 Surpress program output
	-h --help		 Display this help message
```

### [update.js](./scripts/update.js)
**RAM:** 2.65 GB

Download the latest script updates from the repository using wget.
```
[home ~/]> run scripts/update.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/update.js: 

Download the latest script updates from the repository using wget.

Usage:	run update.js [OPTIONS] [DEVICE]
	run update.js --help

	DEVICE			 Device to update, defaults to current machine

Options:
	--skip-self		 Skip updating self (for debugging & used internally)
	--no-banner		 Hide the banner (Used internally)
	-h --help		 Display this help message
```
