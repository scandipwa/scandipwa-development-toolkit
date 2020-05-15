import * as vscode from 'vscode';

import createComponent from './commands/create-component';
import { validateScandiPWA } from './util/file';

const commandMap = {
	'scandipwa-devtools.createNewComponent': createComponent.bind(null, false)
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
