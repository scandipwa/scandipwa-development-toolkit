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

import * as vscode from 'vscode';
import * as path from 'path';

import { extensionRoot } from './create-component';

const {
    createNewFileFromTemplate,
    checkForFolderAndCreate
} = require('../util/file');

const { validateComponentName } = require('../util/validation');

export const createQuery = async () => {
    const pathToSourceFolder = 'src/app/query';
    const queryName = await vscode.window.showInputBox({
        placeHolder: 'MyQuery',
        prompt: 'Enter query name',
        validateInput: validateComponentName
    });

    if (!queryName) {
        vscode.window.showErrorMessage('Query name is required!');
        return;
    }

    checkForFolderAndCreate(pathToSourceFolder);

    createNewFileFromTemplate(
        path.join(extensionRoot, 'templates/query.js'),
        `${pathToSourceFolder}/${queryName}.query.js`,
        /Placeholder/g,
        queryName
    );
};
