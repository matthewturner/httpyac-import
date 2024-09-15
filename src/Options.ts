import { parse } from 'ts-command-line-args';
import { rootLogger } from './logging';

const logger = rootLogger.getSubLogger();

export interface IOptions {
    sourcePath: string;
    targetPath: string;
    ignoreHeaders?: string[];
    splitRequests?: boolean,
    help?: boolean;
}

export function parseOptions(): IOptions {
    const options = parse<IOptions>({
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
            type: Boolean, alias: 'f', optional: true as const, description: 'Determines whether to split requests into separate files [default: true]'
        },
        help: {
            type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide'
        },
    },
        {
            helpArg: 'help',
            headerContentSections: [{ header: 'HttpYac Import', content: 'Converts Postman collections to HttpYac format' }]
        });

    if (options.sourcePath === undefined) {
        logger.error('Source path must be supplied with --sourcePath=path');
        process.exit(1);
    }

    if (options.targetPath === undefined) {
        logger.error('Target path must be supplied with --targetPath=path');
        process.exit(2);
    }

    if (options.splitRequests === undefined) {
        logger.warn('One file will be created per request');
        options.splitRequests = true;
    }

    return options;
}