#! /usr/bin/env node

import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { Collection, ItemGroup, Item, PropertyList } from 'postman-collection';
import { sanitize, outputDirectory, outputPathFor } from './helpers';
import { RequestDefinitionBuilder } from './RequestDefinitionBuilder';
import { parseOptions } from './Options';
import { rootLogger } from './logging';

const packageInfo = JSON.parse(readFileSync('./package.json').toString());

const logger = rootLogger.getSubLogger();

logger.silly(`HttpYac Import v${packageInfo.version}`);

const options = parseOptions();

if (options.purgeTargetPath) {
    if (existsSync(options.targetPath)) {
        logger.warn(`Purging target path ${options.targetPath}...`)
        rmSync(options.targetPath, { recursive: true });
    }
}

const targetPaths = [options.targetPath];

const sourcePostmanCollection = JSON.parse(readFileSync(options.sourcePath).toString());
const sourceCollection = new Collection(sourcePostmanCollection);

let lastTargetFilePath = '';

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

    if (options.target != 'console') {
        if (!existsSync(directory)) {
            logger.info(`Creating directory ${directory}...`);
            mkdirSync(directory, { recursive: true });
        }
    }

    const filePath = outputPathFor(item, options, targetPaths);

    if (lastTargetFilePath == filePath) {
        logger.debug(`Appending request ${item.name}...`);
    } else {
        lastTargetFilePath = filePath;
        logger.info(`Outputting to file ${filePath}...`);
        logger.debug(`Writing request ${item.name}...`);
    }

    const requestDefinition = new RequestDefinitionBuilder()
        .ignoreHeaders(options.ignoreHeaders)
        .includeSeparatorIf(existsSync(filePath))
        .from(item)
        .build()
        .toString();

    if (options.target == 'console') {
        logger.debug(requestDefinition);
    } else {
        writeFileSync(filePath, requestDefinition, { flag: 'a' });
    }
}

processItems(sourceCollection.items);