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

        if (preRequestTest !== undefined) {
            if (preRequestTest.script.exec.length == 1 && preRequestTest.script.exec[0] == '') {
                console.log('Pre request script is not set');
            } else {
                this._definition += '\n\n{{\n';
                this._definition += '// TODO: Fixup Postman pre-request script\n';
                this._definition += `// ${preRequestTest.script.exec.join('\n//')}`;
                this._definition += '\n}}';
            }
        }

        return this;
    }

    appendTestScript(): RequestDefinitionBuilder {
        const test = this._item.events.find(e => e.listen == 'test', null);

        if (test !== undefined) {
            const statusCode = this.statusCodeFor(test);

            if (statusCode != null) {
                this._definition += '\n\n';
                this._definition += `?? status == ${statusCode}`;
            }

            if (test.script.exec.length == 3 && test.script.exec[1].indexOf('pm.response.to.have.status') >= 0) {
                console.log('Post request script is status check only');
            } else {
                this._definition += '\n\n{{\n';
                this._definition += '// TODO: Fixup Postman test script\n';
                this._definition += `// ${test.script.exec.join('\n//')}`;
                this._definition += '\n}}';
            }
        }

        return this;
    }

    appendBody(): RequestDefinitionBuilder {
        if (this._item.request.body !== undefined) {
            this._definition += '\n\n';
            this._definition += 'Content-Type: application/json';
            this._definition += '\n\n';
            this._definition += this._item.request.body.toString();
        }

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

    statusCodeFor(test: Event) {
        for (const exec of test.script.exec) {
            const statusCodeMatch = exec.match(/have\.status\((\d+)\)/);
            if (statusCodeMatch) {
                return statusCodeMatch[1];
            }
        }

        return null;
    }
}