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
    const directory = join(...targetPaths);

    if (!existsSync(directory)) {
        console.log(`Creating directory ${directory}...`);
        mkdirSync(directory, { recursive: true });
    }

    const filename = `${sanitize(item.name)}.http`;
    console.log(`Creating file ${filename}...`);
    const path = join(directory, filename);

    console.log('Writing request definition...');
    const requestDefinition = new RequestDefinitionBuilder()
        .ignoreHeaders(args.ignoreHeaders)
        .from(item)
        .appendName()
        .appendPreRequestScript()
        .appendRequest()
        .appendHeaders()
        .appendBody()
        .appendTestScript()
        .toString();

    console.log(requestDefinition);

    writeFileSync(path, requestDefinition, { flag: 'w' });
}

processItems(sourceCollection.items);