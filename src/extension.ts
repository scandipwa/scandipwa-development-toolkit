import * as vscode from 'vscode';

import { createQuery, extendQuery } from './commands/query';
import createComponent from './commands/create-component';
import extendComponent from './commands/extend-component';
import { Extendable } from './types/extend-component.types';
import { validateScandiPWA } from './util/file';

const commandMap = {
	'scandipwa-devtools.createNewComponent': createComponent.bind(null, false),
	'scandipwa-devtools.createNewRoute': createComponent.bind(null, true),
	'scandipwa-devtools.createNewQuery': createQuery,
	// TODO create new store
	// 'scandipwa-devtools.createNewStore': createStore,
	'scandipwa-devtools.extendCoreComponent': extendComponent.bind(null, Extendable.component),
	'scandipwa-devtools.extendCoreRoute': extendComponent.bind(null, Extendable.route),
	'scandipwa-devtools.extendCoreQuery': extendComponent.bind(null, Extendable.query),
	'scandipwa-devtools.extendCoreStore': extendComponent.bind(null, Extendable.store),
	// 'scandipwa-devtools.extendCoreQuery': extendQuery
};

export function activate(context: vscode.ExtensionContext) {
	Object.entries(commandMap).forEach(
		([ name, handler ]) => {
			const disposable = vscode.commands.registerCommand(
				name,
				() => {
					if (validateScandiPWA()) {
						return handler();
					}
					vscode.window.showErrorMessage('ScandiPWA directory is not recognized!');
				}
			);
			context.subscriptions.push(disposable);
		}
	);
}

export function deactivate() {}
