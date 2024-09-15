import { parse } from 'ts-command-line-args';
import { rootLogger } from './logging';

const logger = rootLogger.getSubLogger();

export interface IOptions {
    sourcePath: string;
    targetPath: string;
    target: string;
    ignoreHeaders?: string[];
    splitRequests?: boolean,
    purgeTargetPath?: boolean,
    help?: boolean;
}

export function parseOptions(): IOptions {
    const options = parse<IOptions>({
        sourcePath: {
            type: String, alias: 's', optional: true as const, description: 'Path to the exported postman_collection.json'
        },
        targetPath: {
            type: String, alias: 't', optional: true as const, description: 'Path to the root directory to output the .http files'
        },
        target: {
            type: String, alias: 'o', optional: true as const, description: 'Either console or file [default: file]'
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
        purgeTargetPath: {
            type: Boolean, alias: 'p', optional: true as const, description: 'Deletes target path and all contents [default: false]'
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

    if (options.target === undefined) {
        options.target = 'file';
    }

    if (options.target === 'file') {
        if (options.targetPath === undefined) {
            logger.error('Target path must be supplied with --targetPath=path');
            process.exit(2);
        }
    }

    if (options.splitRequests === undefined) {
        logger.warn('Requests will be split into separate files. Control with --splitRequests=[true|false]');
        options.splitRequests = true;
    }

    if (options.purgeTargetPath === undefined) {
        options.purgeTargetPath = false;
    }

    return options;
}