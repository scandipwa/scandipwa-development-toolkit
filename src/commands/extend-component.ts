import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import {
    Identifier,
    ExportNamedDeclaration,
    ExportDefaultDeclaration,
    SourceLocation
} from '@babel/types';

import {
    showSourceDirectoryContentInSelect,
    getSourcePath,
    getWorkspacePath
} from '../util/file';

import {
    Extendable,
    FileInformation,
    ExportsPaths,
    ExportData,
    ExportType
} from '../types/extend-component.types';

class Extender {
    protected pathToSourceFolder: string = '';
    protected extendableName: string = '';
    protected extendableType: Extendable;

    /**
     * Initialise instance with corresponding extendable
     * @param extendableType
     */
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

    /**
     * Retrieve name of thing to extend from user
     */
    async getExtendableName() {
        this.extendableName = (await showSourceDirectoryContentInSelect(
            this.pathToSourceFolder,
            `Which ${typeof this.extendableType} to override?`
        ))?.label || '';
    }

    /**
     * Extract export nodes from original code
     * @param originalCode
     */
    getExportPathsFromCode(originalCode: string) : ExportsPaths {
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

        let exportsPaths: ExportsPaths = [];

        traverse(ast, {
            ExportNamedDeclaration: (path) => {
                exportsPaths.push(path);
            },
            ExportDefaultDeclaration: (path) => {
                exportsPaths.push(path);
            }
        });

        return exportsPaths;
    };

    /**
     * Extract additional information from export nodes
     * The following information is retrieved:
     *   + name
     * @param exports
     */
    getNamedExportsNames(exports: ExportsPaths) : ExportData[] {
        const processNamedExport = (path: NodePath<ExportNamedDeclaration>) : ExportData => {
            const getNameFromDeclaration = (declaration: any) : ExportData => {
                const id = <Identifier>declaration.declarations[0].id;
                const { name } = id;

                return { name, type: ExportType.variable };
            };

            const getDataByTraverse = () : ExportData => {
                let searchResult: ExportData = { name: '', type: ExportType.not_yet_assigned };

                traverse(headNode, {
                    ExportSpecifier: (path) => {
                        const { node: { exported: { name } }, node } = path;
                        searchResult = { name, type: ExportType.specifier };
                        path.stop();
                    },
                    ClassDeclaration: (path) => {
                        const { node: { id: { name } }, node } = path;
                        searchResult = { name, type: ExportType.class };
                        path.stop();
                    }
                }, path.scope, null, path.parentPath);

                if (searchResult.type === ExportType.not_yet_assigned) {
                    vscode.window.showWarningMessage(
                        'Could not process some export.'
                        + ' Please, check which export is not processed'
                        + ' and let the developer team know. Thank you!'
                    );
                }

                return searchResult;
            };

            const { node: { declaration }, node: headNode } = path;
            // handle variable declaration
            if (declaration && declaration.type !== 'ClassDeclaration') {
                return getNameFromDeclaration(declaration);
            }

            return getDataByTraverse();
        };

        return exports.filter(e => e.type === 'ExportNamedDeclaration').map(
            (elem): ExportData => processNamedExport(<NodePath<ExportNamedDeclaration>>elem)
        );
    }

    /**
     * Extract additional information from export node
     * The following information is retrieved:
     *   + actual code
     * @param exports
     */
    getDefaultExportCode(exports: ExportsPaths, code: string) : string {
        const processDefaultExport = (path: NodePath<ExportDefaultDeclaration>) : string => {
            const { node: { loc } } = path;
            const { start, end } = <SourceLocation>loc;

            const codeArray = code.split(/\n/gm);
            const exportDeclarationArray = codeArray.reduce(
                (acc, cur, index) => {
                    const lineNumber = ++index;

                    if (lineNumber >= start.line && lineNumber <= end.line) {
                        if (lineNumber === start.line) {
                            acc.push(cur.slice(start.column));
                        } else if (lineNumber === end.line) {
                            acc.push(cur.slice(0, end.column));
                        } else {
                            acc.push(cur);
                        }
                    }

                    return acc;
                }, new Array<string>()
            );

            return exportDeclarationArray.join('\n');
        };

        const exportDefaultPath = exports.filter(e => e.type === 'ExportDefaultDeclaration')[0];
        return processDefaultExport(<NodePath<ExportDefaultDeclaration>>exportDefaultPath);
    }


    /**
     * Retrieve exports that user is willing to extend (from the specified file)
     * @param fileExportsNames
     * @param fileName
     */
    async chooseThingsToExtend(fileExportsNames: string[], fileName: string) : Promise<string[] | undefined> {
        const postfix = fileName.split('.')[1];

        return await vscode.window.showQuickPick(
            fileExportsNames,
            {
                placeHolder: `What do you wish to extend in ${postfix}?`,
                canPickMany: true
            }
        );
    }


    /**
     * Generate all necessary contents for the created file
     *   + imports from source file
     *   + to-do section
     *   + exports from new file
     *   + exports from source file
     * @param fileInfo
     */
    generateNewFileContents(fileInfo: FileInformation) : string {
        const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
        const { fileName, allExports, chosenExports, defaultExportCode } = fileInfo;

        const sourceFilePath = path.join(
            `Source${this.extendableType}`,
            this.extendableName,
            fileName.slice(0, fileName.lastIndexOf('.'))
        );

        const importString = 'import {\n'
            .concat(chosenExports.map(({ name }) => `    ${name} as Source${capitalize(name)},\n`).join(''))
            .concat(`} from \'${sourceFilePath}\';`);


        const generateExportsFromSource = () => {
            const notChosenExports = allExports.filter(
                one => !chosenExports.includes(one)
            );

            if (notChosenExports.length) {
                return 'export {\n'
                    .concat(notChosenExports.map(({ name }) => `    ${name},\n`).join(''))
                    .concat(`} from \'${sourceFilePath}\';`);
            }

            return '';
        };

        const generateClassExtend = () => {
            const classExport = chosenExports.find(one => one.type === ExportType.class);
            if (!classExport) {
                return '';
            }

            return `export class ${classExport.name} extends Source${classExport.name} {\n`
                + '    // TODO implement logic\n'
                + '};';
        };

        const exportFromSourceString = generateExportsFromSource();
        const classExtend = generateClassExtend();

        const extendString = chosenExports
            .filter(one => one.type !== ExportType.class)
            .map(({ name }) =>
                `//TODO: implement ${name}\n`
                + `export const ${name} = Source${capitalize(name)};`
            )
            .join('\n\n');

        // Generate new file: imports + exports from source + all extendables + exdf
        let result = importString;
        if (exportFromSourceString) {
            result = [result, exportFromSourceString].join('\n\n');
        }
        if (extendString) {
            result = [result, extendString].join('\n\n');
        }
        if (classExtend) {
            result = [result, classExtend].join('\n\n');
        }
        result = [result, defaultExportCode].join('\n\n');

        return result + '\n';
    };

    /**
     * Create a new file and fill it with given contents
     * @param newFilePath
     * @param contents
     */
    async createNewFileWithContents(newFilePath: string, contents: string) {
        this.createDestinationDirectoryIfNotExists();
        // Prevent overwrites
        if (fs.existsSync(newFilePath)) {
            return;
        }

        fs.writeFile(
            newFilePath,
            contents,
            console.error
        );
    }

    /**
     * Check for directory and create if it does not exist
     */
    createDestinationDirectoryIfNotExists() {
        const destinationDirectoryPath = path.resolve(
            getWorkspacePath(),
            this.pathToSourceFolder,
            this.extendableName
        );

        // Handle destination's parent directory does not exist
        const sourceFolderAbsolutePath = path.resolve(getWorkspacePath(), this.pathToSourceFolder);
        if (!fs.existsSync(sourceFolderAbsolutePath)) {
            fs.mkdirSync(sourceFolderAbsolutePath);
        }

        // Handle destination directory does not exist
        if (!fs.existsSync(destinationDirectoryPath)) {
            fs.mkdirSync(destinationDirectoryPath);
        }
    }

    /**
     * Entry point
     */
    async process() {
        await this.getExtendableName();
        if (!this.extendableName) {
            vscode.window.showErrorMessage(`${typeof this.extendableType} name is required!`);
            return;
        }

        const resourceDirectory = path.join(getSourcePath(this.pathToSourceFolder), this.extendableName);
        const resourceList = fs
            .readdirSync(resourceDirectory)
            .filter(fileName => fileName.match(/\.js$/) && fileName !== 'index.js');

        await resourceList.reduce(
            async (acc: Promise<any>, fileName: string): Promise<any> => {
                await acc;
                const fullSourcePath = path.resolve(resourceDirectory, fileName);
                const newFilePath = path.resolve(
                    getWorkspacePath(),
                    this.pathToSourceFolder,
                    this.extendableName,
                    fileName
                );

                // Prevent overwriting
                if (fs.existsSync(newFilePath)) { return; }

                const code = fs.readFileSync(fullSourcePath, 'utf-8');
                const exportsPaths = this.getExportPathsFromCode(code);
                const namedExportsData = this.getNamedExportsNames(exportsPaths);
                const defaultExportCode = this.getDefaultExportCode(exportsPaths, code);
                const chosenThingsToExtend = await this.chooseThingsToExtend(namedExportsData.map(x => x.name), fileName);

                // Handle not extending anything in the file
                if (!chosenThingsToExtend) { return; }

                const chosenExports = chosenThingsToExtend.reduce(
                    (acc, cur): Array<ExportData> => {
                        const foundValue = namedExportsData.find(one => one.name === cur);
                        if (foundValue) {
                            acc.push(foundValue);
                        }

                        return acc;
                    }, new Array<ExportData>()
                );

                const newFileContents = this.generateNewFileContents({
                    allExports: namedExportsData,
                    chosenExports,
                    defaultExportCode,
                    fileName
                });
                this.createNewFileWithContents(newFilePath, newFileContents);
            }, Promise.resolve(undefined)
        );
    }
}

export default async (type: Extendable) => {
    await new Extender(type).process();
};