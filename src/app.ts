#! /usr/bin/env node

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { Collection, ItemGroup, Item, PropertyList } from 'postman-collection';
import { parse } from 'ts-command-line-args';
import { IOptions } from './Options'
import { join } from 'path';
import { sanitize } from './helpers';
import { RequestDefinitionBuilder } from './RequestDefinitionBuilder';

const args = parse<IOptions>({
    sourcePath: {
        type: String, alias: 's', optional: true as const, description: 'Path to the exported postman_collection.json'
    },
    targetPath: {
        type: String, alias: 'd', optional: true as const, description: 'Path to the root directory to output the .http files'
    },
    ignoreHeaders: {
        type: String,
        alias: 'i',
        multiple: true,
        optional: true as const,
        description: 'List of headers to ignore, useful when using default headers. Supports regex patterns',
        defaultValue: []
    },
    splitRequests: {
        type: Boolean, alias: 'f', optional: true as const, description: 'Determines whether to split requests across multiple files [default: true]'
    },
    help: {
        type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide'
    },
},
    {
        helpArg: 'help',
        headerContentSections: [{ header: 'HttpYac Import', content: 'Converts Postman collections to HttpYac format' }]
    });

if (args.sourcePath === undefined) {
    console.log('Source path must be supplied with --sourcePath=path');
    process.exit(1);
}

if (args.targetPath === undefined) {
    console.log('Target path must be supplied with --targetPath=path');
    process.exit(2);
}

if (args.splitRequests === undefined) {
    console.log('One file will be created per request');
    args.splitRequests = true;
}

const sourcePostmanCollectionPath = args.sourcePath;
const sourcePostmanCollection = JSON.parse(readFileSync(sourcePostmanCollectionPath).toString());

const targetPaths = [args.targetPath];

const sourceCollection = new Collection(sourcePostmanCollection);

function processItems(items: PropertyList<Item | ItemGroup<Item>>) {
    for (const item of items.all()) {
        if (item instanceof Item) {
            processItem(item);
            continue;
        }

        const propertyGroup = <ItemGroup<Item>>item;
        targetPaths.push(sanitize(item.name));
        processItems(propertyGroup.items);
        targetPaths.pop();
    }
}

function processItem(item: Item) {
    const directory = outputDirectory();

    if (!existsSync(directory)) {
        console.log(`Creating directory ${directory}...`);
        mkdirSync(directory, { recursive: true });
    }

    const path = outputPathFor(item);

    console.log('Writing request definition...');
    const requestDefinition = new RequestDefinitionBuilder()
        .ignoreHeaders(args.ignoreHeaders)
        .includeSeparatorIf(existsSync(path))
        .from(item)
        .build()
        .toString();

    console.log(requestDefinition);

    writeFileSync(path, requestDefinition, { flag: 'a' });
}

function outputDirectory() {
    if (args.splitRequests) {
        return join(...targetPaths);
    }

    return join(...targetPaths.slice(0, -1));
}

function outputPathFor(item: Item) {
    const directory = join(...targetPaths);

    if (args.splitRequests) {
        const filename = `${sanitize(item.name)}.http`;
        console.log(`Creating file ${filename}...`);
        return join(directory, filename);
    }

    return `${directory}.http`;
}

processItems(sourceCollection.items);