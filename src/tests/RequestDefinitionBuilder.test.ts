import { RequestDefinitionBuilder } from '../RequestDefinitionBuilder';
import { Item, ItemGroup, Collection, Url, Header, RequestBody, Event } from 'postman-collection';
import { readFileSync } from 'fs';

describe('Request Definition Builder', () => {
    const sourcePostmanCollection = JSON.parse(readFileSync('sample.postman_collection.json').toString());
    const sourceCollection = new Collection(sourcePostmanCollection);

    const rootGroup = <ItemGroup<Item>>sourceCollection.items.all().at(0);
    const v1Group = <ItemGroup<Item>>rootGroup.items.all().at(0);
    const getRequest = <Item>v1Group.items.all().at(0);

    test('Splits request line', () => {
        getRequest.request.url = new Url('http://host.com?color=red')

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendRequest();

        const actual = target.toString();

        expect(actual).toBe('\n\nGET host.com/\n    ?color=red');
    });

    test('Adds single header', () => {
        getRequest.request.headers.clear();

        const header = new Header('option');
        header.key = 'SomeHeader';
        header.value = 'SomeValue';
        getRequest.request.headers.add(header);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendHeaders();

        const actual = target.toString();

        expect(actual).toBe('\nSomeHeader: SomeValue');
    });

    test('Adds multiple headers', () => {
        getRequest.request.headers.clear();

        const header1 = new Header('option');
        header1.key = 'SomeHeader1';
        header1.value = 'SomeValue1';
        getRequest.request.headers.add(header1);

        const header2 = new Header('option');
        header2.key = 'SomeHeader2';
        header2.value = 'SomeValue2';
        getRequest.request.headers.add(header2);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendHeaders();

        const actual = target.toString();

        expect(actual).toBe('\nSomeHeader1: SomeValue1\nSomeHeader2: SomeValue2');
    });

    test('Ignores exact header', () => {
        getRequest.request.headers.clear();

        const header1 = new Header('option');
        header1.key = 'SomeHeader1';
        header1.value = 'SomeValue1';
        getRequest.request.headers.add(header1);

        const header2 = new Header('option');
        header2.key = 'SomeHeader2';
        header2.value = 'SomeValue2';
        getRequest.request.headers.add(header2);

        const target = new RequestDefinitionBuilder()
            .ignoreHeaders(['SomeHeader1'])
            .from(getRequest)
            .appendHeaders();

        const actual = target.toString();

        expect(actual).toBe('\nSomeHeader2: SomeValue2');
    });

    test('Ignores header based on regex pattern', () => {
        getRequest.request.headers.clear();

        const header1 = new Header('option');
        header1.key = 'SomeHeader1';
        header1.value = 'SomeValue1';
        getRequest.request.headers.add(header1);

        const header2 = new Header('option');
        header2.key = 'SomeHeader2';
        header2.value = 'SomeValue2';
        getRequest.request.headers.add(header2);

        const header3 = new Header('option');
        header3.key = 'ExactHeader3';
        header3.value = 'SomeValue3';
        getRequest.request.headers.add(header3);

        const target = new RequestDefinitionBuilder()
            .ignoreHeaders(['Some.*'])
            .from(getRequest)
            .appendHeaders();

        const actual = target.toString();

        expect(actual).toBe('\nExactHeader3: SomeValue3');
    });

    test('Adds body with default content-type header', () => {
        getRequest.request.body = new RequestBody({ mode: 'json', raw: '{ "some": "value" }' });

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendBody();

        const actual = target.toString();

        expect(actual).toBe('\nContent-Type: application/json\n\n{ "some": "value" }');
    });

    test('Adds body with single content-type header', () => {
        getRequest.request.body = new RequestBody({ mode: 'json', raw: '{ "some": "value" }' });
        getRequest.request.headers.clear();

        const header1 = new Header('option');
        header1.key = 'Content-Type';
        header1.value = 'application/json';
        getRequest.request.headers.add(header1);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendHeaders()
            .appendBody();

        const actual = target.toString();

        expect(actual).toBe('\nContent-Type: application/json\n\n{ "some": "value" }');
    });

    test('Converts simple status code test script to concise format', () => {
        getRequest.events.clear();

        const event1 = new Event({
            listen: 'test', script: {
                exec:
                    [
                        "pm.test(\"Status test\", function () {\r",
                        "    pm.response.to.have.status(200);\r",
                        "});"
                    ]
            }
        });
        getRequest.events.add(event1);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n?? status == 200');
    });

    test('Sets id from response as global variable', () => {
        getRequest.events.clear();

        const event1 = new Event({
            listen: 'test', script: {
                exec:
                    [
                        "pm.test(\"Status test\", function () {\r",
                        "    pm.environment.set(\"someId\", pm.response.json().id);\r",
                        "});"
                    ]
            }
        });
        getRequest.events.add(event1);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n    $global.someId = response.parsedBody.id;'
            + '\n}}'
        );
    });

    test('Adds unknown test script commented out', () => {
        getRequest.events.clear();

        const event1 = new Event({ listen: 'test', script: { exec: ['console.log("something");'] } });
        getRequest.events.add(event1);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n// TODO: Fixup Postman test script'
            + '\n// console.log("something");'
            + '\n}}'
        );
    });

    test('Adds unknown pre-request script commented out', () => {
        getRequest.events.clear();

        const event1 = new Event({ listen: 'prerequest', script: { exec: ['console.log("something");'] } });
        getRequest.events.add(event1);

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendPreRequestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n// TODO: Fixup Postman pre-request script'
            + '\n// console.log("something");'
            + '\n}}'
        );
    });
});