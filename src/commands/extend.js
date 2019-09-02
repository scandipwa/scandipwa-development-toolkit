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
    findExportsInFile,
    createNewFileWithContent,
    showSourceDirectoryContentInSelect,
    getSourcePath
} = require('../util/file');

const prepareConstOptions = (exportOptions) => {
    return exportOptions.map(label => ({ label, description: 'const' }));
}

const prepareClassOptions = (exportOptions, type, name) => {
    switch (type) {
    case 'component':
        return [{ label: name, description: 'class' }];
    default:
        return exportOptions.map(label => ({ label, description: 'class' }))
    }
};

const prepareFileExportRewriteOptions = (type, { constExp = [], classExp = [] }, componentName) => {
    const options = [
        ...prepareConstOptions(constExp),
        ...prepareClassOptions(classExp, type, componentName)
    ];

    return options;
}

const capitilize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const buildImportExport = (imports, sourcePath) => {
    const { defaultExp, constExp, classExp } = imports;

    // No multiple class declaration in one file
    const { name: className, extended: classExtened } = classExp[0];
    const classImport = !classExtened ? className : `Source${className}`;

    const exportsAndImports = {
        classImport: `import ${ classImport } from '${ sourcePath }';`,
        defaultExport: `export default ${ defaultExp }`
    };

    if (constExp.length) {
        const constExportString = constExp.map(({ name }) => name).join(', ');
        const constImportString = constExp.map(({ name, extended }) => (
            extended ? `${name} as Source${capitilize(name)}` : name
        )).join(', ');

        exportsAndImports['constExport'] = `export { ${ constExportString } };`;
        exportsAndImports['constImport'] = `import { ${ constImportString } } from '${ sourcePath }';`;
    }

    return exportsAndImports;
};

const getStyleFileName = (styleOption, componentName) => {
    switch (styleOption) {
    case 'extend':
        return `${componentName}.override.style.scss`;
    case 'override':
        return `${componentName}.style.scss`;
    default:
        return;
    }
};

const getStyleImport = (name) => {
    if (!name) return;
    return `import './${name}';`
}

const getTODOString = (imports) => {
    // @ts-ignore
    const { classExp = [], constExp = [] } = imports;
    const classConstExp = [...Object.values(classExp), ...Object.values(constExp)];
    const TODO = classConstExp.reduce((acc, selected) => {
        const { name, extended } = selected;
        if (!extended) return acc;
        return [...acc, `// TODO: implement ${name}`];
    }, []);
    return TODO.length ? '\n' + TODO.join('\n') + '\n' : '';
}

module.exports = async (isRoute) => {
    const pathToSourceFolder = isRoute ? 'src/app/route' : 'src/app/component';

    const component = await showSourceDirectoryContentInSelect(
        pathToSourceFolder,
        isRoute ? 'Which route to override?' : 'Which component to override?'
    )

    if (!component) {
        vscode.window.showErrorMessage('Component name is required!');
        return;
    }

    // @ts-ignore
    const { label: componentName } = component;

    const searchedFiles = {
        'component': `${componentName}.component.js`,
        'container': `${componentName}.container.js`,
        'config': `${componentName}.config.js`
    };

    const exportsInFiles = await Object.entries(searchedFiles).reduce(async (acc, [label, subPath]) => {
        const awaitAcc = await acc;

        const path = `${getSourcePath(pathToSourceFolder)}/${componentName}/${subPath}`;
        const fileExports = findExportsInFile(path);
        if (!fileExports) return awaitAcc;

        const fileRewrites = await vscode.window.showQuickPick(
            prepareFileExportRewriteOptions(label, fileExports, componentName),
            {
                placeHolder: `What should we extend in ${ label }?`,
                canPickMany: true
            }
        ) || [];

        return {
            ...awaitAcc,
            [label]: {
                selected: fileRewrites.map(({ label }) => label),
                available: fileExports
            }
        };
    }, {});

    const style = await vscode.window.showQuickPick(
        [
            { label: 'Leave them as they are!', target: 'leave' },
            { label: 'Extend them!', target: 'extend' },
            { label: 'Override them!', target: 'override' },
        ],
        { placeHolder: 'What should we do with styles?' }
    );

    if (!style) {
        vscode.window.showErrorMessage('Please tell us what to do with styles!');
        return;
    }

    const { target: styleOption } = style;

    let atLeastOneOptionIsSelected = false;
    const exportOptions = Object.entries(exportsInFiles);

    const styleFile = getStyleFileName(styleOption, componentName);
    const styleImport = getStyleImport(styleFile);

    checkForFolderAndCreate(pathToSourceFolder);
    checkForFolderAndCreate(`${pathToSourceFolder}/${componentName}`);

    createNewFileFromTemplate(
        path.join(__dirname, `../templates/stylesheet.scss`),
        `${pathToSourceFolder}/${componentName}/${styleFile}`,
        /Placeholder/g,
        componentName
    );

    for (let i = 0; i < exportOptions.length; i++) {
        const [fileType, { selected, available }] = exportOptions[i];
        
        // check for at least one selected options (and it does not require to extend style)
        if (
            !selected.length
            && (fileType !== 'component' || styleOption !== 'extend')
        ) continue;

        atLeastOneOptionIsSelected = true;

        // generate imports
        const imports = Object.entries(available).reduce((acc, [exportType, exportedStrings]) => {
            let exported;

            switch (exportType) {
            case 'defaultExp':
                exported = exportedStrings;
                break;
            default:
                exported = exportedStrings.map(name => ({
                    name,
                    extended: selected.includes(name)
                }));
                break;
            }

            return {
                ...acc,
                [exportType]: exported
            }
        }, {});

        if (fileType === 'component') {
            imports['classExp'] = [
                ...imports['classExp'],
                {
                    name: componentName,
                    extended: !!(selected.length || styleOption !== 'extend')
                }
            ];
        }

        const getImportSourcePath = () => {
            const mainImportName = isRoute ? 'SourceRoute' : 'SourceComponent';
            return `${mainImportName}/${componentName}/${searchedFiles[fileType].split('.').slice(0, -1).join('.')}`;
        }

        const {
            classImport,
            constImport,
            constExport,
            defaultExport
        } = buildImportExport(
            imports, // prepared imports
            getImportSourcePath() // path to source component 
        );

        const pathToNewFile = `${pathToSourceFolder}/${componentName}/${searchedFiles[fileType]}`;
        const newFileContent = [
            classImport,
            constImport,
            (fileType === 'component') ? styleImport : undefined,
            getTODOString(imports),
            constExport,
            defaultExport,
            ''
        ].filter(s => s !== undefined).join('\n');

        createNewFileWithContent(pathToNewFile, newFileContent);
    }

    if (!atLeastOneOptionIsSelected) {
        vscode.window.showInformationMessage('No extend option was seleced. Please select at least one.');
    }
};
