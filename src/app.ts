#! /usr/bin/env node

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { Collection, ItemGroup, Item, PropertyList } from 'postman-collection';
import { sanitize, outputDirectory, outputPathFor } from './helpers';
import { RequestDefinitionBuilder } from './RequestDefinitionBuilder';
import { parseOptions } from './Options';
import { Logger, ILogObj } from 'tslog';

const logger = new Logger<ILogObj>();

const options = parseOptions();

const targetPaths = [options.targetPath];

const sourcePostmanCollection = JSON.parse(readFileSync(options.sourcePath).toString());
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
    const directory = outputDirectory(options, targetPaths);

    if (!existsSync(directory)) {
        logger.info(`Creating directory ${directory}...`);
        mkdirSync(directory, { recursive: true });
    }

    const path = outputPathFor(item, options, targetPaths);

    logger.info('Writing request definition...');
    const requestDefinition = new RequestDefinitionBuilder()
        .ignoreHeaders(options.ignoreHeaders)
        .includeSeparatorIf(existsSync(path))
        .from(item)
        .build()
        .toString();

    logger.info(requestDefinition);

    writeFileSync(path, requestDefinition, { flag: 'a' });
}

processItems(sourceCollection.items);