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
const path = require('path');
const { createNewFileFromTemplate, checkForFolderAndCreate } = require('../util/file');
const { validateComponentName } = require('../util/validation');

const getFileMap = (containerFeatures) => {
    const files = {
        'component.js': '../templates/component.js',
        'style.scss': '../templates/stylesheet.scss',
    };

    if (!containerFeatures.length) return files;

    const containerName = containerFeatures.reduce(
        (acc, { target }) => acc += `-${target}`,
        'container'
    );

    return {
        ...files,
        'container.js': `../templates/${containerName}.js`
    };
};

module.exports = async (isRoute) => {
    const pathToSourceFolder = isRoute ? 'src/app/route' : 'src/app/component';

    const componentName = await vscode.window.showInputBox({
        placeHolder: !isRoute ? 'MyComponent' : 'MyRoute',
        prompt: !isRoute ? 'Enter component name' : 'Enter route name',
        validateInput: validateComponentName
    });

    if (!componentName) {
        vscode.window.showErrorMessage(!isRoute
            ? 'Component name is required!'
            : 'Route name is required!'
        );
        return;
    }

    const containerFeatures = await vscode.window.showQuickPick(
        [
            { label: 'Contains business logic', target: 'logic' },
            { label: 'Connected to global state', target: 'state' }
        ],
        {
            placeHolder: 'Select features of your container',
            canPickMany: true
        }
    ) || [];

    checkForFolderAndCreate(pathToSourceFolder);
    checkForFolderAndCreate(`${pathToSourceFolder}/${componentName}`);

    createNewFileFromTemplate(
        path.join(__dirname, `../templates/${
            containerFeatures.length ? 'index-container.js' : 'index.js'
        }`),
        `${pathToSourceFolder}/${componentName}/index.js`,
        /Placeholder/g,
        componentName
    );

    Object.entries(getFileMap(containerFeatures)).forEach(([postfix, src]) => {
        createNewFileFromTemplate(
            path.join(__dirname, src),
            `${pathToSourceFolder}/${componentName}/${componentName}.${postfix}`,
            /Placeholder/g,
            componentName
        );
    });
};