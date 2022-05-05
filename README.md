# Bitburner - Scripts
A collection of scripts & information pertaining to the [open source](https://github.com/danielyxie/bitburner) game 
[Bitburner](https://danielyxie.github.io/bitburner/).

## Table of Contents
- [Bitburner - Scripts](#bitburner-scripts)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
- [Guide](#guide)
  - [BitNode 1](#bitnode-1)
- [Scripts](#scripts)
    - [banner.js](#bannerjs)
    - [botnet-manager.js (WIP)](#botnet-managerjs-wip)
    - [connect.js](#connectjs)
    - [copy.js](#copyjs)
    - [crawler.js](#crawlerjs)
    - [find-target.js](#find-targetjs)
    - [hacknet-manager.js](#hacknet-managerjs)
    - [miner.js](#minerjs)
    - [network-graph.js](#network-graphjs)
    - [rm.js](#rmjs)
    - [rootkit.js](#rootkitjs)
    - [server-manager.js](#server-managerjs)
    - [update.js](#updatejs)

## Quick Start

```bash
# Download the update script in-game & run it
wget https://gitlab.zakscode.com/ztimson/Bitburner/-/raw/develop/scripts/update.js scripts/update.js
run scripts/update.js # Repeat to pull the latest

# View the network
run scripts/network-graph.js --verbose
run scripts/netowkr-graph.js -v --filter CSEC # Find path to a specific device

# Start the node manager in auto-mode
run scripts/node-manager.js -a

# Chain the crawler & rootkit to root all devices on the network
run scripts/crawler.js --not-rooted /scripts/rootkit.js {{TARGET}}

# Find the most profitable server & use the crawler to deploy miners on the network targeting it
run scripts/find-target.js # Output: n00dles
run scriipts/crawler.js --rooted --remote-exec /scripts/miner.js n00dles

# Install backdoor on CSEC
run scripts/rootkit.js CSEC
run scripts/connect.js CSEC
backdoor
```

Learn more about the [available scripts](#scripts) bellow or pass the `--help` flag to any of the included scripts in-game.

## Guide
This guide documents how you can use this repository to progress through the game. You should complete the tutorial
first if you haven't already.

### BitNode 1
1. First you need to download this repo into the game. Manually download `update.js` & run it:
`wget https://gitlab.zakscode.com/ztimson/Bitburner/-/raw/develop/scripts/update.js scripts/update.js; run scripts/update.js` 
2. Scan the network to figure out your bearings, take note of discovered server's required hack level:
`run scripts/network-graph.js -vd 3`
3. Root the lowest level server (probably n00dles) & make it hack itself for money. You should repeat this step when 
ever your hack level is high enough to hack another a new server. `run scripts/rootkit.js n00dles /scripts/miner.js`
4. Start `hacknet-manger.js`. You won't have enough *RAM* in the beginning to run the manager & hack servers. It's 
recommended you `tail` the manager, so you can easily start/stop it as needed. `run script/hacknet-manager.js -a`
5. Once you have enough money ($??,???.??), upgrade your home severs *RAM*: 
`City > alpha ent. > Upgrade 'home' RAM (8.00GB -> 16.00GB)`
6. At this point you have enough *RAM* to use `crawler.js` to automatically discover servers & hack them. Continue to
run this periodically as your hack level increases & you unlock more exploits:
`run scripts/crawler.js -n /scripts/rootkit.js {{TARGET}} /scripts/miner.js`

## Scripts

### [banner.js](./scripts/banner.js)
**RAM:** 1.60 GB

Aesthetic & serves no real purpose. Prints a banner to the terminal & can repeat after game restarts.
```
[home ~/]> run scripts/banner.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/banner.js: 

Display an ASCII banner.

Usage:	run banner.js [OPTIONS] 
	run banner.js --help 

Options:
	-r, --reboot            Automatically display after game reboots
	-h, --help              Display this help message
```

### [botnet-manager.js (WIP)](./scripts/botnet-manager.js)
**RAM:** 7.15 GB

Late-game solution to hack servers. It orchestrates an unlimited number of servers to carry out distributed batched 
attacks against targets. It includes a bunch of utilities to quickly dispatch single commands to all workers. Manger
can be tailed for live updates.
```
[home ~/]> run /scripts/botnet-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/botnet-manager.js:

Connect & manage a network of devices to launch distributed attacks.

Usage:	run botnet-manager.js [OPTIONS] 
	run botnet-manager.js [OPTIONS] COMMAND
	run botnet-manager.js --help [COMMAND]

Options:
	-s, --silent            Suppress program output
	-h, --help              Display this help message

Commands:
	copy                    Copy file & dependencies to swarm nodes
	join                    Connect device as a worker node to the swarm
	kill                    Kill any scripts running on worker nodes
	leave                   Disconnect worker node from swarm
	run                     Copy & run script on all worker nodes
	start                   Start this device as the swarm manager
```

### [connect.js](./scripts/connect.js)
**RAM:** 1.85 GB

The built in `connect` command only allows you to connect to devices in the immediate vicinity or servers that have
backdoors installed requiring you to make several jumps. This script will automatically find a path & connect you saving
you some time.
```
[home ~/]> run /scripts/connect.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/connect.js: 

Connect to a server anywhere in the network without a backdoor.

Usage:	run connect.js [OPTIONS] SERVER
	run connect.js --help 

	SERVER                  Server to connect to

Options:
	-h, --help              Display this help message
```

### [copy.js](./scripts/copy.js)
**RAM:** 4.20 GB

Scripts often import other scripts requiring multiple `scp` calls before it can be run on a remote machine. This script 
will automatically scan the file being copied for imports & recursively scan & copy the dependencies. Plus it has a
fancy animated loading bar.
```
[home ~/]> run scripts/copy.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/copy.js: 

Copy a file & it's dependencies to a server.

Usage:	run copy.js [OPTIONS] FILE SERVER [ARGS]...
	run copy.js --help 

	FILE                    File to copy
	SERVER                  Server to copy file(s) to
	ARGS                    Arguments to start file/script with

Options:
	-c, --cpu               Number of CPU threads to start script with, will use maximum if not specified
	-e, --execute           Start script after copying
	-n, --no-deps           Skip copying dependencies
	-q, --quite             Suppress program output
	-h, --help              Display this help message
```

### [crawler.js](./scripts/crawler.js)
**RAM:** 5.80 GB

Mid-game solution to distribute & run scripts across the network.
```
[home ~/]> run scripts/crawler.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/crawler.js: 

Search the network for servers to execute a script against.

Usage:	run crawler.js [OPTIONS] SCRIPT [ARGS]...
	run crawler.js --help 

	SCRIPT                  Script to copy & execute
	ARGS                    Arguments for script. Forward the discovered server with: {{SERVER}}

Options:
	-c, --cpu               Number of CPU threads to start script with, will use maximum if not specified
	-d, --depth             Depth to scan to, defaults to 3
	-k, --kill              Kill all running scripts on the server
	--level                 Skip servers with higher hack level, defaults to current hack level
	-e, --remote-exec       Execute script on remote server
	-r, --rooted            Only servers that have been rooted
	-n, --not-rooted        Only servers that have not been rooted
	-p, --ports             Skip servers with too many closed ports
	-q, --quite             Suppress program output
	-v, --verbose           Display the server names in the final report
	-h, --help              Display this help message
```

### [find-target.js](./scripts/find-target.js)
**RAM:** 4.05 GB

A utility to help figure out which server is worth hacking the most. It does this by estimating the financial yield per
minute for each server & returns the servers in a sorted list.
```
[home ~/]> run scripts/find-target.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/find-target.js: 

Scan the network for the best servers(s) to hack.

Usage:	run find-target.js [OPTIONS] 
	run find-target.js --help 

Options:
	-c, --count             Number of servers to return
	-r, --rooted            Only servers that have been rooted
	-n, --not-rooted        Only servers that have not been rooted
	-v, --verbose           Display the estimated income per minute per core
	-h, --help              Display this help message
```

### [hacknet-manager.js](./scripts/hacknet-manager.js)
**RAM:** 5.70 GB

An early game solution to automate the hacknet & get easy money.
```
[home ~/]> run scripts/hacknet-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/hacknet-manager.js: 

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.

Usage:	run hacknet-manager.js [OPTIONS] [LIMIT]
	run hacknet-manager.js --help 

	LIMIT                   Limit the number of nodes the manager will buy, defaults to 8 or the current number of nodes

Options:
	-a, --auto-limit        Automatically increase the node limit when there is nothing to do
	-b, --balance           Prevent spending bellow point
	-s, --sleep             Amount of time to wait between purchases, defaults to 1 (second)
	-h, --help              Display this help message
```

### [miner.js](./scripts/miner.js)
**RAM:** 2.45 GB

An early-game HGW script to steal money from servers. You can deploy this on each server and have them hack themselves, 
or they can all target the server with the most money which is more efficient (see [find-target.js](#find-targetjs)).
```
[home ~/]> run scripts/miner.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/miner.js: 

Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.

Usage:	run hacknet-manager.js [OPTIONS] [LIMIT]
	run hacknet-manager.js --help 

	LIMIT                   Limit the number of nodes the manager will buy, defaults to 8 or the current number of nodes

Options:
	-a, --auto-limit        Automatically increase the node limit when there is nothing to do
	-b, --balance           Prevent spending bellow point
	-s, --sleep             Amount of time to wait between purchases, defaults to 1 (second)
	-h, --help              Display this help message
```

### [network-graph.js](./scripts/network-graph.js)
**RAM:** 3.85 GB

A utility to scan the network & build a visual tree of all the devices. It comes with lots of flags to narrow down the
results. It's useful for figuring out where you are, manually finding targets & discovering the path to a server & 
connecting to it.
```
[home ~/]> run /scripts/network-graph.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/network-graph.js: 

Scan the network for servers and display as an ASCII tree. Servers with root access are highlighted & bold. Click to
automatically connect.

Usage:	run network-graph.js [OPTIONS] [SERVER]
	run network-graph.js --help 

	SERVER                  Point to start scan from, defaults to local server

Options:
	-d, --depth             Depth to scan to
	-f, --filter            Filter to servers matching name
	-e, --regex             Filter to servers matching pattern
	-l, --level             Display the required hack level & number of ports to root: [level|port]
	-n, --not-rooted        Filter to servers that have not been rooted
	-r, --rooted            Filter to servers that have been rooted
	-s, --specs             Display the server specifications: {CPU|RAM}
	-u, --usage             Display the server utilization: (USG%)
	-v, --verbose           Display level, specs & usage in that order: [HL|P] {CPU|RAM} (USG%)
	-h, --help              Display this help message
```

### [rm.js](./scripts/rm.js)
**RAM:** 2.85 GB

[bitburner-connector](https://plugins.jetbrains.com/plugin/18338-bitburner-connector) would occasionally push my IDE
files to the game, so I created this simple script to recursively search & delete files from a directory to save me 
from having to delete files one-by-one.
```
[home ~/scripts]> run /scripts/rm.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/rm.js: 

Recursively delete files inside a directory

Usage:	run rm.js [OPTIONS] PATH [SERVER]
	run rm.js --help 

	PATH                    Path to recursively search
	SERVER                  Run on remote server

Options:
	-f, --force             Remove game files (.exe, .lit, .msg)
	-r, --recursive         Delete everything inside directory
	-h, --help              Display this help message
```

### [rootkit.js](./scripts/rootkit.js)
**RAM:** 4.65 GB

Automatically gains root on the local or remote server. A script can be passed as an additional argument; it will be
copied and automatically executed with the maximum number of threads after being rooted.
```
[home ~/]> run scripts/rootkit.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/rootkit.js: 

Scan the network for servers and display as an ASCII tree. Servers with root access are highlighted & bold.

Usage:	run network-graph.js [OPTIONS] [SERVER]
	run network-graph.js --help 

	SERVER                  Point to start scan from, defaults to local server

Options:
	-d, --depth             Depth to scan to
	-f, --filter            Filter to servers matching name
	-e, --regex             Filter to servers matching pattern
	-l, --level             Display the required hack level & number of ports to root: [level|port]
	-n, --not-rooted        Filter to servers that have not been rooted
	-r, --rooted            Filter to servers that have been rooted
	-s, --specs             Display the server specifications: {CPU|RAM}
	-u, --usage             Display the server utilization: (USG%)
	-v, --verbose           Display level, specs & usage in that order: [HL|P] {CPU|RAM} (USG%)
	-h, --help              Display this help message
```

### [server-manager.js](./scripts/server-manager.js)
**RAM:** 11.35 GB

Mid-game script to handle purchasing and upgrading servers for more computer power. You can also set a script to run
automatically after purchase. Useful to chain with `miner.js` or `botnet.js`.
```
[home ~/]> run /scripts/server-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/server-manager.js: 

Automate the buying & upgrading of servers. Automatically starts script after purchase. Tail for live updates.

Usage:	run server-manager.js [OPTIONS] [SCRIPT] [ARGS]...
	run server-manager.js --help 

	SCRIPT                  Script to copy & execute
	ARGS                    Arguments for script. Forward the discovered server with: {{SERVER}}

Options:
	-b, --balance           Prevent spending bellow point
	-c, --cpu               Number of CPU threads to start script with, will use maximum if not specified
	-l, --limit             Limit the number of servers that can be purchased, defaults to 25
	-r, --ram               Amount of RAM to purchase new servers with, defaults to 8 GB
	-s, --sleep             Amount of time to wait between purchases, defaults to 1 (second)
	-h, --help              Display this help message
```

### [update.js](./scripts/update.js)
**RAM:** 2.65 GB

Uses the in-game `wget` to download all the scripts in this repository. Can target remote servers to quickly copy the 
entire toolkit to the target.
```
[home ~/]> run scripts/update.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/update.js: 

Download the latest script updates from the repository using wget.

Usage:	run update.js [OPTIONS] [DEVICE]
	run update.js --help 

	DEVICE                  Device to update, defaults to current machine

Options:
	--skip-self             Skip updating self (for debugging & used internally)
	--no-banner             Hide the banner (Used internally)
	-h, --help              Display this help message
```
