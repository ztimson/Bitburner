# BitBurner - Scripts
A collection of scripts & information pertaining to the [open source](https://github.com/danielyxie/bitburner) game 
[BitBurner](https://danielyxie.github.io/bitburner/).

## Table of Contents
- [BitBurner - Scripts](#bitburner-scripts)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
- [Guide](#guide)
  - [BitNode 1](#bitnode-1)
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
    - [server-manager.js (WIP)](#server-managerjs-wip)
    - [update.js](#updatejs)

## Quick Start

```bash
# Download the update script in-game & run it
wget https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/update.js scripts/update.js
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
`wget https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/update.js scripts/update.js; run scripts/update.js` 
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

#### Examples
```bash
# Start the manager
run scripts/botnet-manager.js start
# Add a single server to the botnet
run scripts/botnet-manager.js join --device n00dles
# Add all rooted servers to the botnet
run scripts/crawler.js -r /scripts/botnet-manager.js join --device {{TARGET}}
# Distribute & run a script on the entire botnet network
run scripts/botnet-manager.js run /scripts/miner.js n00dles
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

Search the network for a device and connect to it.

Usage:	run connect.js DEVICE
	run connect.js --help

	DEVICE			 Device to connect to

Options:
	-h --help		 Display this help message
```

#### Examples
```bash
# Connect to a server without knowing where it is
run scripts/connect.js CSEC
run scripts/connect.js I.I.I.I
```

### [copy.js](./scripts/copy.js)
**RAM:** 3.50 GB

Scripts often import other scripts requiring multiple `scp` calls before it can be run on a remote machine. This script 
will automatically scan the file being copied for imports & recursively scan & copy the dependencies. Plus it has a
fancy animated loading bar.
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
	-n --no-deps		 Skip copying dependencies
	-s --silent		 Surpress program output
	-h --help		 Display this help message
```

#### Examples
```bash
# Copy the miner script with it's dependencies
run scripts/copy.js /scripts/miner.js n00dles
# Copy without the animated bar & dependencies
run scripts/copy.js -sn /scripts/miner.js n00dles
```

### [crawler.js](./scripts/crawler.js)
**RAM:** 4.15 GB

Mid-game solution to distribute & run scripts across the network.
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
	-l --level		 Exclude targets with higher hack level, defaults to current hack level
	-e --remote-exec 	 Copy script to remote device & run there
	-r --rooted		 Filter to devices that have been rooted
	-n --not-rooted		 Filter to devices that have not been rooted
	-p --ports		 Exclude targets with too many closed ports
	-s --silent		 Suppress program output
	-v --verbose		 Display the device names in the final report
	-h --help		 Display this help message
```

#### Examples
```bash
# Run a command on the local machine targeting discovered devices
run scripts/crawler.js -n /scripts/rootkit.js {{TARGET}}
# Chain the miner to the rootkit to automatically deploy it
run scripts/crawler.js -n /scripts/rootkit.js {{TARGET}} /scripts/miner.js
# Deploy a script on rooted devices
run scripts/crawler.js -re /scripts/miner.js n00dles
```

### [find-target.js](./scripts/find-target.js)
**RAM:** 6.00 GB

A utility to help figure out which server is worth hacking the most. It does this by estimating the financial yield per
minute for each server & returns the servers in a sorted list.
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

#### Examples
```bash
# Rank all the servers on the network
run scripts/find-target.js -v
# Best server currently rooted
run scripts/find-target.js -rc 1
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

	LIMIT			 Limit the number of nodes the manager will buy, defaults to 8

Options:
	-a --auto-limit		 Automatically increase the node limit when there is nothing to do
	-b --balance		 Prevent spending bellow point
	-s --sleep		 Amount of time to wait between purchases, defaults to 1 (second)
	-h --help		 Display this help message
```

#### Examples
```bash
# Start the manager to 8 nodes & prevent spending while we have less than $1 million
run scripts/hacknet-manager.js -b 1E6 8
# Let the hacknet manage & grow itself
run scripts/hacknet-manager.js -a
```

### [miner.js](./scripts/miner.js)
**RAM:** 2.45 GB

An early-game HGW script to steal money from servers. You can deploy this on each server and have them hack themselves, 
or they can all target the server with the most money which is more efficient (see [find-target.js](#find-targetjs)).
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

#### Examples
```bash
# Use home to hack another server
run scripts/miner.js n00dles
# Make remote server hack itself
run scripts/rootkit.js noodles /scripts/miner.js
# Make remote server hack another remote server
run scripts/rootkit.js noodles /scripts/miner.js foodnstuff
# Distribute the miner on entire network to hack a single server
run scripts/crawler.js /scripts/rootkit.js {{TARGET}} /scripts/miner.js foodnstuff
```

### [network-graph.js](./scripts/network-graph.js)
**RAM:** 3.85 GB

A utility to scan the network & build a visual tree of all the devices. It comes with lots of flags to narrow down the
results. It's useful for figuring out where you are, manually finding targets & discovering the path to a server.
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

#### Example
```bash
# Show the entire network
run scripts/network-graph.js -v
# Show servers within 3 hops that still need to be rooted
run scripts/network-graph.js -nvd 3
# Show servers you have rooted
run scripts/network-graph.js -r
# Find a specific server
run scripts/network-graph.js -f CSEC
```

### [rootkit.js](./scripts/rootkit.js)
**RAM:** 5.05 GB <small>(Can be reduced to 4.80 GB)</small>

Programs can be commented out to lower the cost of running.

Automatically gains root on the local or remote server. A script can be passed as an additional argument; it will be
copied and automatically executed with the maximum number of threads after being rooted.
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

#### Examples
```bash
# Hack a remote server
run scripts/rootkit.js n00dles
# Start the miner after hacking
run scripts/rootkit.js n00dles /scripts/miner.js foodnstuff
```

### [server-manager.js (WIP)](./scripts/server-manager.js)
**RAM:** 9.35 GB

Early game script to handle purchasing and upgrading servers for more computer power.
```
[home ~/]> run /scripts/server-manager.js --help
Running script with 1 thread(s), pid 1 and args: ["--help"].
/scripts/server-manager.js: 

Automate the buying & upgrading of servers.

Usage:	run server-manager.js [OPTIONS] 
	run server-manager.js --help 

Options:
	-b, --balance           Prevent spending bellow point
	-l, --limit             Limit the number of servers that can be purchased, defaults to 25
	-r, --ram               Amount of RAM to purchase new servers with, defaults to 8 GB
	-s, --sleep             Amount of time to wait between purchases, defaults to 1 (second)
	-h, --help              Display this help message
```

#### Examples
```bash
# Start automatically purchasing & upgrading servers
run scripts/server-manager.js --ram 16
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

	DEVICE			 Device to update, defaults to current machine

Options:
	--skip-self		 Skip updating self (for debugging & used internally)
	--no-banner		 Hide the banner (Used internally)
	-h --help		 Display this help message
```

#### Examples
```bash
# Download the scripts to local computer
run scripts/update.js
# Download scripts to a remote computer
run scripts/update.js n00dles
```
