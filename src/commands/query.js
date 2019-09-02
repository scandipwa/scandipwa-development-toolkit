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
const {
    createNewFileFromTemplate,
    checkForFolderAndCreate,
    showSourceDirectoryContentInSelect,
    createNewFileWithContent
} = require('../util/file');

const { validateComponentName } = require('../util/validation');

const createQuery = async () => {
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
        path.join(__dirname, '../templates/query.js'),
        `${pathToSourceFolder}/${queryName}.query.js`,
        /Placeholder/g,
        queryName
    );
};

const extendQuery = async () => {
    const pathToSourceFolder = 'src/app/query';

    const component = await showSourceDirectoryContentInSelect(
        pathToSourceFolder,
        'Which query to override?'
    )

    if (!component) {
        vscode.window.showErrorMessage('Component name is required!');
        return;
    }

    // @ts-ignore
    const { label: queryPath } = component;
    const queryName = queryPath.replace('.query.js', '');

    checkForFolderAndCreate(pathToSourceFolder);

    const pathToNewFile = `${pathToSourceFolder}/${queryPath}`;
    const newFileContent = [
        `import { ${queryName} as Source${queryName} } from 'SourceQuery/${queryName}.query';`,
        '',
        `// TODO: implement ${queryName}`,
        '',
        `export default new ${queryName}()`,
        ''
    ].join('\n');

    createNewFileWithContent(pathToNewFile, newFileContent);
};

module.exports = {
    createQuery,
    extendQuery
};
