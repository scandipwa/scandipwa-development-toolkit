import * as vscode from 'vscode';

import { createQuery } from './commands/create-query';
import createComponent from './commands/create-component';
import extend from './commands/extender';
import { Extendable } from './types/extend-component.types';
import { validateScandiPWA } from './util/file';

const commandMap = {
	'scandipwa-devtools.createNewComponent': createComponent.bind(null, false),
	'scandipwa-devtools.createNewRoute': createComponent.bind(null, true),
	'scandipwa-devtools.createNewQuery': createQuery,
	// TODO create new store
	// 'scandipwa-devtools.createNewStore': createStore,
	'scandipwa-devtools.extendCoreComponent': extend.bind(null, Extendable.component),
	'scandipwa-devtools.extendCoreRoute': extend.bind(null, Extendable.route),
	'scandipwa-devtools.extendCoreQuery': extend.bind(null, Extendable.query),
	'scandipwa-devtools.extendCoreStore': extend.bind(null, Extendable.store),
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
