#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Toggle VPN {VPN_NAME}
// @raycast.mode silent

// Optional parameters:
// @raycast.icon wg-icon.png
// @raycast.packageName Wireguard

const VPN_NAME = 'VPN NAME' // type wireguard vpn connection name

import {exec} from 'child_process'
import util from 'util'

class VPN {
	constructor(id, name, status) {
		this.id = id
		this.name = name
		this.status = status.includes('(Connected)')
	}
}

class WGControl {
	VPN_NAME
	CMD_PATH = '/usr/sbin/scutil'
	VPN_LIST = `${this.CMD_PATH} --nc list | grep "com.wireguard.macos"`
	REG_VPN = /(\(\w+\))\s+([\w-]+?)\s+VPN\s+\(.*?"(.*?)"?\s+\[VPN:/gm

	constructor(vpnName) {
		this.VPN_NAME = vpnName
	}

	#startVpn(id) {
		return `${this.CMD_PATH} --nc start ${id}`
	}

	#stopVpn(id) {
		return `${this.CMD_PATH} --nc stop ${id}`
	}

	#notFound() {
		console.log(`VPN with ${this.VPN_NAME} name not found`)
	}

	async #execScript(command) {
		const execAsync = util.promisify(exec)
		const {stdout} = await execAsync(command)
		return stdout
	}

	async #findVpn() {
		const scriptResult = await this.#execScript(this.VPN_LIST)
		const splitedResult = scriptResult.split('\n').find(str => str.includes(this.VPN_NAME))
		if (splitedResult) {
			const parsedData = this.REG_VPN.exec(splitedResult)
			return new VPN(parsedData[2], parsedData[3], parsedData[1])
		}
	}

	async toggleVpn() {
		const vpnInstance = await this.#findVpn()
		if (!vpnInstance) {
			return this.#notFound()
		}
		this.VPN_NAME = vpnInstance.name
		if (!vpnInstance.status) {
			await this.#execScript(this.#startVpn(vpnInstance.id))
			console.log(`${this.VPN_NAME} Connected`)
		} else {
			await this.#execScript(this.#stopVpn(vpnInstance.id))
			console.log(`${this.VPN_NAME} Disconnected`)
		}
	}
}

const wgControl = new WGControl(VPN_NAME)
void wgControl.toggleVpn()

