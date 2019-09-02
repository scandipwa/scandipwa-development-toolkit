# ScandiPWA development toolkit

#### Made to simplify your work with internal components, routes and queries.

This extension is a core extension of ScandiPWA extension pack for development in VSCode editor. 

> **NOTE #0**: The store related file support is coming soon!

> **NOTE #1**: This extension is in beta, please use with caution and report any issues to Scandipwa Github.

## Requirements

1. Node 10^ + npm 6.8^
2. VSCode ^1.37

> **NOTE**: Extension might work on previous versions as well, it is not yet tested.

## How to use?

1. Install `vsce` – official extension packaging tool

```
npm i -g vsce
```

2. Pack the extension

```
vsce package
```

3. Open command pallete, type `> Install from VSIX`

4. Choose generated `.vsix` file

## Features

### Commands

- ScandiPWA: Create new component
- ScandiPWA: Extend source component
- ScandiPWA: Create new route
- ScandiPWA: Extend source query
- ScandiPWA: Create new query
- ScandiPWA: Extend source route

### Configuration

- Path to Scandipwa source (relative), default value:

```
../../../../../vendor/scandipwa/source/
```

### Snippets

When editing JavaScript file type one of the snippet prefixes listed below and press `Tab` to replace keyword with predefined template.

| Prefix      | Template                                 |
| ----------- | ---------------------------------------- |
| **exdf**    | Default export declaration for IndexJS   |
| **comp**    | Creates new ScandiPWA component          |
| **ecomp**   | Extends Source ScandiPWA component       |
| **cont**    | Creates new ScandiPWA container class    |
| **econt**   | Extends Source ScandiPWA container class |
| **con**     | Connects component to redux              |
| **mstp**    | Declares mapStateToProps                 |
| **mdtp**    | Declared mapDispatchToProps              |
| **qc**      | Creates new ScandiPWA query              |
| **eqc**     | Extends ScandiPWA Source query           |
| **eroute**  | Extends ScandiPWA Source Route component |
| **ecroute** | Extends ScandiPWA Source Route container |
| **crd**     | Creates reducer                          |
| **erd**     | Extends ScandiPWA reducer                |
| **cdisp**   | Creates new ScandiPWA dispatcher         |
| **edisp**   | Extends ScandiPWA dispatcher             |