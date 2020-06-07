import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export const getWorkspacePath = () : string => {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
};

/**
 * Make sure the extension is executed in ScandiPWA working directory
 */
export const validateScandiPWA = () => {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];

    if (!workspaceFolders?.length) {
        return false;
    }
    if (!fs.existsSync(path.join(getWorkspacePath(), 'src/app'))) {
        return false;
    }
    if (!fs.existsSync(path.join(getWorkspacePath(), 'src/config'))) {
        return false;
    }
    return true;
};

const openFile = (destFile: string) : void => {
    vscode.workspace.openTextDocument(destFile).then(
        editor => vscode.window.showTextDocument(editor)
    );
};

export const createNewFileFromTemplate = async (src: string, dest: string, pattern: RegExp, name: string) : Promise<void> => {
    if (!src || !dest || !name) {
        return;
    }
    const data = await fs.readFileSync(src, 'utf8');
    const content = data.replace(pattern, name);
    const destFile = `${getWorkspacePath()}/${dest}`;
    await fs.writeFileSync(destFile, content);
    openFile(destFile);
};

const getDirContents = (path: string) : string[] => {
    if (!fs.existsSync(path)) {
        return [];
    }
    return fs.readdirSync(path);
};

/**
 * Get path to corresponding (src/app/<this>) folder
 * @param pathToSourceFolder
 */
export const getSourcePath = (pathToSourceFolder: string) : string => {
    const sourcePath : string = vscode.workspace.getConfiguration().get('scandipwa.sourcePath') || '';
    return path.join(getWorkspacePath(), sourcePath, pathToSourceFolder);
};

export const showSourceDirectoryContentInSelect = async (pathToSourceFolder: string, placeHolder: string) => {
    const componentNames = await getDirContents(getSourcePath(pathToSourceFolder))
        .map(directoryEntry => {
            if (pathToSourceFolder.includes('query')) {
                return directoryEntry.split('.')[0];
            }

            return directoryEntry;
        })
        .filter(x => x !== ('index.js'));

    return await vscode.window.showQuickPick(
        componentNames.map(label => ({ label })),
        { placeHolder }
    );
};
