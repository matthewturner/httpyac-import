import { IOptions } from './Options';
import { join } from 'path';
import { Item } from 'postman-collection';
import { Logger, ILogObj } from 'tslog'

const logger = new Logger<ILogObj>();

export function sanitize(name: string) {
    return name
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll('"', '')
        .replaceAll('/', '_');
}

export function outputDirectory(options: IOptions, targetPaths: string[]) {
    if (options.splitRequests) {
        return join(...targetPaths);
    }

    return join(...targetPaths.slice(0, -1));
}

export function outputPathFor(item: Item, options: IOptions, targetPaths: string[]) {
    const directory = join(...targetPaths);

    if (options.splitRequests) {
        const filename = `${sanitize(item.name)}.http`;
        logger.info(`Creating file ${filename}...`);
        return join(directory, filename);
    }

    return `${directory}.http`;
}