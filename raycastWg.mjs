#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Toggle VPN {VPN_NAME}
// @raycast.mode silent

// Optional parameters:
// @raycast.icon wg-icon.png
// @raycast.packageName Wireguard


import {exec} from 'child_process'
import util from 'util'

const COMMANDS = {
	CMD_PATH: '/usr/sbin/scutil',

	getVpnList: function() {
		return `${this.CMD_PATH} --nc list | grep "com.wireguard.macos"`
	},

	startVpn: function(id) {
		return `${this.CMD_PATH} --nc start ${id}`
	},

	stopVpn: function(id) {
		return `${this.CMD_PATH} --nc stop ${id}`
	},
}

async function runScript(command) {
	const execAsync = util.promisify(exec)
	const {stdout} = await execAsync(command)
	return stdout.replace(/\r?\n$/, '')
}

async function toggleVpn() {
	const REG_VPN = /\* (\(\w+\))\s+([\w-]+?)\s+VPN\s+\(.*?"(.*?)"?\s+\[VPN:/gm
	const VPNItems = []
	const cmdResult = await runScript(COMMANDS.getVpnList())
	let execString = REG_VPN.exec(cmdResult)
	while (execString !== null) {
		const isConnected = execString[1] === '(Connected)'
		const sn = execString[2]
		const VPNName = execString[3]
		const VPNItem = {name: VPNName, sn: sn, isConnected: isConnected}
		if (VPNName.includes('JLM')) {
			VPNItems.push(VPNItem)
			break
		}
		execString = REG_VPN.exec(cmdResult)
	}
	if (!VPNItems.length) {
		console.log('VPN not found')
		return
	}
	const connection = VPNItems[0]
	if (!connection.isConnected) {
		await runScript(COMMANDS.startVpn(connection.sn))
	} else {
		await runScript(COMMANDS.stopVpn(connection.sn))
	}
}

void toggleVpn()