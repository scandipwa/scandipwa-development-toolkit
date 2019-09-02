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

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const getWorkspacePath = () => {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
}

const createNewFileFromTemplate = async (src, dest, pattern, name) => {
    if (!src || !dest || !name) return;
    const data = await fs.readFileSync(src, 'utf8');
    const content = data.replace(pattern, name);
    const destFile = `${getWorkspacePath()}/${dest}`;
    await fs.writeFileSync(destFile, content);
    openFile(destFile);
};

const openFile = (destFile) => {
    vscode.workspace.openTextDocument(destFile).then(
        editor => vscode.window.showTextDocument(editor)
    );
}

const createNewFileWithContent = async (path, content) => {
    const destFile = `${getWorkspacePath()}/${path}`;
    await fs.writeFileSync(destFile, content);
    openFile(destFile);
};

const findExportsInFile = (src) => {
    if (!fs.existsSync(src)) return false;
    return {
        constExp: findPatternInFile(src, /(?<=export const ).(\S+)/gm),
        classExp: findPatternInFile(src, /(?<=export class ).(\S+)/gm),
        defaultExp: findPatternInFile(src, /(?<=export default ).*/gm)
    };
};

const findPatternInFile = (src, pattern) => {
    if (!src || !pattern) return;
    const fileContent = fs.readFileSync(src, 'utf-8');
    return fileContent.match(pattern) || [];
}

const checkForFolderAndCreate = (name) => {
    const dirName = `${getWorkspacePath()}/${name}`;
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }
};

const getDirFolders = (path) => {
    if (!fs.existsSync(path)) return [];
    return fs.readdirSync(path);
};

const validateScandiPWA = () => {
    if (!vscode.workspace.workspaceFolders.length) return false;
    if (!fs.existsSync(path.join(getWorkspacePath(), 'src/app'))) return false;
    if (!fs.existsSync(path.join(getWorkspacePath(), 'src/config'))) return false;
    return true;
};

const getSourcePath = (pathToSourceFolder) => {
    const sourcePath = vscode.workspace.getConfiguration().get('scandipwa.sourcePath');
    return path.join(getWorkspacePath(), sourcePath, pathToSourceFolder);
};

const showSourceDirectoryContentInSelect = async (pathToSourceFolder, placeHolder) => {
    const componentNames = await getDirFolders(getSourcePath(pathToSourceFolder));    
    return await vscode.window.showQuickPick(componentNames.map(label => ({ label })), { placeHolder });
};

module.exports = {
    getWorkspacePath,
    createNewFileFromTemplate,
    checkForFolderAndCreate,
    getDirFolders,
    validateScandiPWA,
    findPatternInFile,
    findExportsInFile,
    createNewFileWithContent,
    showSourceDirectoryContentInSelect,
    getSourcePath
};
