import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const getWorkspacePath = () : string => {
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


export const checkForFolderAndCreate = (name: String) : void => {
    const dirName = `${getWorkspacePath()}/${name}`;
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }
};

const openFile = (destFile: string) : void => {
    vscode.workspace.openTextDocument(destFile).then(
        editor => vscode.window.showTextDocument(editor)
    );
}

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