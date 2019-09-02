/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/scandipwa-development-toolkit
 * @link https://github.com/scandipwa/scandipwa-development-toolkit
 */

 const vscode = require('vscode');
const createComp = require('./commands/create');
const extendComp = require('./commands/extend');
const { createQuery, extendQuery } = require('./commands/query');
const { validateScandiPWA } = require('./util/file');

const commandMap = {
	'extension.createNewComp': createComp,
	'extension.createNewRoute': createComp.bind(null, true),
	'extension.extendCoreComp': extendComp,
	'extension.extendCoreRoute': extendComp.bind(null, true),
	'extension.createNewQuery': createQuery,
	'extension.extendCoreQuery': extendQuery
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	Object.entries(commandMap).forEach(([command, handler]) => {
		let disposable = vscode.commands.registerCommand(command, () => {
			if (validateScandiPWA()) return handler();
			vscode.window.showErrorMessage('ScandiPWA directory is not recognized!');
		});
		context.subscriptions.push(disposable);
	});
}

exports.activate = activate;

module.exports = {
	activate,
	deactivate: () => {}
}
