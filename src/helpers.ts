import { Event, Item } from 'postman-collection';

export function sanitize(name: string) {
    return name
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll('"', '')
        .replaceAll('/', '_');
}

export function requestDefinitionFrom(item : Item) {
    let requestDefinition = `### ${item.name}`

    requestDefinition += '\n\n';

    requestDefinition += `${item.request.method} ${item.request.url.getHost()}${item.request.url.getPath()}`;

    let paramCount = 0;
    for (let x of item.request.url.query.all()) {
        if (paramCount == 0) {
            requestDefinition += `\n    ?${x}`
            paramCount++;
        } else {
            requestDefinition += `\n    &${x}`
        }
    }

    if (item.request.body !== undefined) {
        requestDefinition += 'Content-Type: application/json';
        requestDefinition += '\n\n';
        requestDefinition += item.request.body.toString();
    }
    
    const test = item.events.find(e => e.listen == 'test', null);

    if (test !== undefined) {
        const statusCode = statusCodeFor(test);

        if (statusCode != null) {
            requestDefinition += '\n\n';
            requestDefinition += `?? status == ${statusCode}`;
        }

        if (test.script.exec.length == 3 && test.script.exec[1].indexOf('pm.response.to.have.status') >= 0) {
            console.log('Post request script is status check only');
        } else {
            requestDefinition += '\n\n{{\n';
            requestDefinition += `// ${test.script.exec.join('\n//')}`;
            requestDefinition += '\n}}';
        }
    }

    return requestDefinition;
}

export function statusCodeFor(test: Event) {
    for (const exec of test.script.exec) {
        const statusCodeMatch = exec.match(/have\.status\((\d+)\)/);
        if (statusCodeMatch) {
            return statusCodeMatch[1];
        }
    }

    return null;
}