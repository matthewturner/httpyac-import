import { Event, Item } from 'postman-collection';

export class RequestDefinitionBuilder {
    _definition: string;
    _item: Item

    constructor() {
        this._definition = '';
    }

    from(item: Item): RequestDefinitionBuilder {
        this._item = item;

        if (this._definition.length > 0) {
            this._definition += '\n\n\n';
        }

        return this;
    }

    appendName(): RequestDefinitionBuilder {
        this._definition += `### ${this._item.name}`
        return this;
    }

    appendPreRequestScript() : RequestDefinitionBuilder {
        const preRequestTest = this._item.events.find(e => e.listen == 'prerequest', null);

        if (preRequestTest === undefined) {
            return this;
        }

        if (preRequestTest.script.exec.length == 1 && preRequestTest.script.exec[0] == '') {
            console.log('Pre request script is not set');
            return this;
        }

        this._definition += '\n\n{{\n';
        this._definition += '// TODO: Fixup Postman pre-request script\n';
        this._definition += `// ${preRequestTest.script.exec.join('\n//')}`;
        this._definition += '\n}}';

        return this;
    }

    appendTestScript(): RequestDefinitionBuilder {
        const test = this._item.events.find(e => e.listen == 'test', null);

        if (test === undefined) {
            return this;
        }

        let handled = true;
        let statusCode = null;
        let idProperty = '';
        let etagProperty = '';
        const idRegex = /\s+pm\.environment\.set\("(\w+)\", pm\.response\.json\(\)\.id\);/;
        const etagRegex = /\s+pm\.environment\.set\("(\w+)\", pm\.response\.headers\.get\(\"Etag\"\)\);/;
        for (const statement of test.script.exec) {
            if (statement.startsWith('pm.test')) {
                continue;
            }

            if (statement === '});') {
                continue;
            }

            if (statement.indexOf('pm.response.to.have.status') >= 0 ){
                statusCode = this.statusCodeFor(statement);
                continue;
            }

            const idMatch = idRegex.exec(statement);
            if (idMatch) {
                idProperty = idMatch[1];
                continue;
            }

            const etagMatch = etagRegex.exec(statement);
            if (etagMatch) {
                etagProperty = etagMatch[1];
                continue;
            }

            handled = false;
        }

        if (statusCode != null) {
            this._definition += '\n\n';
            this._definition += `?? status == ${statusCode}`;
        }

        if (!handled || idProperty != '' || etagProperty != '') {
            this._definition += '\n\n{{';
        }

        if (idProperty != '') {
            this._definition += '\n';
            this._definition += `    $global.${idProperty} = response.parsedBody.id;`
        }

        if (etagProperty != '') {
            this._definition += '\n';
            this._definition += `    $global.${etagProperty} = response.headers.etag;`
        }

        if (!handled) {
            this._definition += '\n';
            this._definition += '// TODO: Fixup Postman test script\n';
            this._definition += `// ${test.script.exec.join('\n//')}`;
            this._definition += '\n}}';
        }

        if (!handled || idProperty != '' || etagProperty != '') {
            this._definition += '\n}}';
        }

        return this;
    }

    appendBody(): RequestDefinitionBuilder {
        if (this._item.request.body === undefined) {
            return this;
        }

        this._definition += '\n';
        this._definition += 'Content-Type: application/json';
        this._definition += '\n\n';
        this._definition += this._item.request.body.toString();

        return this;
    }

    appendRequest(): RequestDefinitionBuilder {
        this._definition += '\n\n';

        this._definition += `${this._item.request.method} ${this._item.request.url.getHost()}${this._item.request.url.getPath()}`;

        let paramCount = 0;
        for (let x of this._item.request.url.query.all()) {
            if (paramCount == 0) {
                this._definition += `\n    ?${x}`
                paramCount++;
            } else {
                this._definition += `\n    &${x}`
            }
        }

        return this;
    }

    toString(): string {
        return this._definition;
    }

    statusCodeFor(statement: string) {
        const statusCodeMatch = statement.match(/have\.status\((\d+)\)/);
        if (statusCodeMatch) {
            return statusCodeMatch[1];
        }

        return null;
    }
}