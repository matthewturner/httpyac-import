import { IOptions } from './Options';
import { join } from 'path';
import { Item } from 'postman-collection';

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
        return join(directory, filename);
    }

    return `${directory}.http`;
}