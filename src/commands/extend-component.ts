import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import {
    ExportNamedDeclaration,
    Identifier,
} from '@babel/types';

import {
    showSourceDirectoryContentInSelect,
    getSourcePath,
    checkForFolderAndCreate
} from '../util/file';

enum ExportType {
    class,
    specifier,
    variable
}

interface Export {
    type: ExportType,
    name: string,
    node: ExportNamedDeclaration
};

export enum Extendable {
    route,
    component
}

interface ISearchedFiles  {
    [key: string]: string
};

const getExportsNames = (originalCode: string) : Export[] => {
    const ast = parse(originalCode, {
        sourceType: "unambiguous",
        plugins: [
            'jsx',
            'classProperties',
            'dynamicImport',
            'optionalCatchBinding',
            'optionalChaining',
            'objectRestSpread'
        ]
    });

    let names: Export[] = [];

    traverse(ast, {
        ExportNamedDeclaration: (path) => {
            const { node } = path;
            const { declaration } = node;

            // handle variable declaration
            if (declaration && declaration.type !== 'ClassDeclaration') {
                const id = <Identifier>declaration.declarations[0].id;
                const { name } = id;

                if (name) {
                    names.push({
                        type: ExportType.variable,
                        node,
                        name
                    });
                }

                return;
            }

            traverse(node, {
                ExportSpecifier: (path) => {
                    const { node: { exported: { name } } } = path;
                    names.push({
                        type: ExportType.specifier,
                        node,
                        name
                    });
                },
                ClassDeclaration: (path) => {
                    const { node: { id: { name } } } = path;
                    names.push({
                        type: ExportType.class,
                        node,
                        name
                    });
                }
            }, path.scope, null, path.parentPath);
        }
    });

    return names;
};

class Extender {
    protected pathToSourceFolder: string = '';
    protected extendableName: string = '';
    protected extendableType: Extendable;

    constructor(extendableType: Extendable) {
        this.extendableType = extendableType;
        switch (extendableType) {
        case Extendable.route:
            this.pathToSourceFolder = 'src/app/route';
            break;
        case Extendable.component:
            this.pathToSourceFolder = 'src/app/component';
            break;
        }
    }

    async acquireExtendableName() {
        this.extendableName = (await showSourceDirectoryContentInSelect(
            this.pathToSourceFolder,
            `Which ${typeof this.extendableType} to override?`
        ))?.label || '';
    }

    getSearchedFiles = (): ISearchedFiles => ({
        'component': `${this.extendableName}.component.js`,
        'container': `${this.extendableName}.container.js`,
        'config': `${this.extendableName}.config.js`
    });

    async generateNewFileContents (exports: string[], ) : Promise<string> {
        const fileContents = '';
        const exportString = `export {\n${
            1 // TODO implement
        }}\nfrom Source${this.extendableName};\n`;

        return fileContents;
    };

    async createNewFile(exports: string[], newFilePath: string) {
        // Prevent overwrites
        if (fs.existsSync(newFilePath)) {
            return;
        }

        checkForFolderAndCreate(this.pathToSourceFolder);
        checkForFolderAndCreate(path.resolve(this.pathToSourceFolder, this.extendableName));
        fs.writeFile(
            newFilePath,
            await this.generateNewFileContents(exports),
            console.error
        );
    }

    getThingsToExtend = () => {
        return Object.entries(this.getSearchedFiles()).reduce(
            async (asyncAcc, [ label, subPath ]) => {
                let acc: any = await asyncAcc;
                const extendablePath = `${getSourcePath(this.pathToSourceFolder)}/${this.extendableName}/${subPath}`;
                if (!fs.existsSync(extendablePath)) {
                    return;
                }

                const code = fs.readFileSync(extendablePath, 'utf-8');
                const exports = await getExportsNames(code);

                const fileRewrites = await vscode.window.showQuickPick(
                    exports.map(x => x.name),
                    {
                        placeHolder: `What do you wish to extend in ${label}?`,
                        canPickMany: true
                    }
                );

                acc.push({
                    label,
                    fileRewrites
                });
                return acc;

            }, new Promise(resolve => resolve([]))
        );
    };

    async process() {
        await this.acquireExtendableName();
        if (!this.extendableName) {
            vscode.window.showErrorMessage(`${typeof this.extendableType} name is required!`);
            return;
        }

        const thingsToExtend = this.getThingsToExtend();
    }
}

export default (type: Extendable) => {
    new Extender(type).process();
};