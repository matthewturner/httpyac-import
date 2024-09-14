export interface IOptions {
    sourcePath: string;
    targetPath: string;
    ignoreHeaders?: string[];
    splitRequests?: boolean,
    help?: boolean;
}
