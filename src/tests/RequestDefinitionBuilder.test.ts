import { RequestDefinitionBuilder } from '../RequestDefinitionBuilder';
import { Item, ItemGroup, Collection, Url, Header, RequestBody, Event } from 'postman-collection';
import { readFileSync } from 'fs';
import { Logger, ILogObj } from 'tslog';

describe('Request Definition Builder', () => {
    let getRequest: Item;
    let target: RequestDefinitionBuilder;

    const logger = new Logger<ILogObj>({ minLevel: 6 });

    beforeEach(() => {
        const sourcePostmanCollection = JSON.parse(readFileSync('sample.postman_collection.json').toString());
        const sourceCollection = new Collection(sourcePostmanCollection);

        const rootGroup = <ItemGroup<Item>>sourceCollection.items.all().at(0);
        const v1Group = <ItemGroup<Item>>rootGroup.items.all().at(0);

        getRequest = <Item>v1Group.items.all().at(0);

        target = new RequestDefinitionBuilder(logger);
    });

    test('Splits request line', () => {
        getRequest.request.url = new Url('http://host.com?color=red');

        target.from(getRequest)
            .appendRequest();

        const actual = target.toString();

        expect(actual).toBe('\n\nGET host.com'
            + '\n    ?color=red');
    });

    test('Splits request line with path', () => {
        getRequest.request.url = new Url('http://host.com/items?color=red');

        target.from(getRequest)
            .appendRequest();

        const actual = target.toString();

        expect(actual).toBe('\n\nGET host.com/items'
            + '\n    ?color=red');
    });

    test('Splits request line with multiple query parameters', () => {
        getRequest.request.url = new Url('http://host.com?color=red&flavor=sweet');

        target.from(getRequest)
            .appendRequest();

        const actual = target.toString();

        expect(actual).toBe('\n\nGET host.com'
            + '\n    ?color=red'
            + '\n    &flavor=sweet');
    });

    test('Handles missing headers', () => {
        getRequest.request.headers = undefined;

        target.from(getRequest)
            .appendHeaders();

        const actual = target.toString();

        expect(actual).toBe('');
    });

    test('Adds single header', () => {
        getRequest.request.headers.clear();

        const header = new Header('option');
        header.key = 'SomeHeader';
        header.value = 'SomeValue';
        getRequest.request.headers.add(header);

        target.from(getRequest)
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

        target.from(getRequest)
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

        target.ignoreHeaders(['SomeHeader1'])
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

        target.ignoreHeaders(['Some.*'])
            .from(getRequest)
            .appendHeaders();

        const actual = target.toString();

        expect(actual).toBe('\nExactHeader3: SomeValue3');
    });

    test('Handles missing body', () => {
        getRequest.request.body = undefined;

        target.from(getRequest)
            .appendBody();

        const actual = target.toString();

        expect(actual).toBe('');
    });

    test('Adds body with default content-type header', () => {
        getRequest.request.body = new RequestBody({ mode: 'json', raw: '{ "some": "value" }' });

        target.from(getRequest)
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

        target.from(getRequest)
            .appendHeaders()
            .appendBody();

        const actual = target.toString();

        expect(actual).toBe('\nContent-Type: application/json\n\n{ "some": "value" }');
    });

    test('Handles missing test script', () => {
        getRequest.events.clear();

        target.from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('');
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

        target.from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n?? status == 200');
    });

    test('Handles invalid status code in test script', () => {
        getRequest.events.clear();

        const event1 = new Event({
            listen: 'test', script: {
                exec:
                    [
                        "pm.test(\"Status test\", function () {\r",
                        "    pm.response.to.have.status(xxx);\r",
                        "});"
                    ]
            }
        });
        getRequest.events.add(event1);

        target.from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n// TODO: Fixup Postman test script'
            + '\n// pm.test("Status test", function () {'
            + '\r\n//     pm.response.to.have.status(xxx);'
            + '\r\n// });\n'
            + '}}');
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

        target.from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n    $global.someId = response.parsedBody.id;'
            + '\n}}'
        );
    });

    test('Sets etag from response as global variable', () => {
        getRequest.events.clear();

        const event1 = new Event({
            listen: 'test', script: {
                exec:
                    [
                        "pm.test(\"Status test\", function () {\r",
                        "    pm.environment.set(\"someEtag\", pm.response.headers.get(\"Etag\"));\r",
                        "});"
                    ]
            }
        });
        getRequest.events.add(event1);

        target.from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n    $global.someEtag = response.headers.etag;'
            + '\n}}'
        );
    });

    test('Adds unknown test script commented out', () => {
        getRequest.events.clear();

        const event1 = new Event({ listen: 'test', script: { exec: ['console.log("something");'] } });
        getRequest.events.add(event1);

        target.from(getRequest)
            .appendTestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n// TODO: Fixup Postman test script'
            + '\n// console.log("something");'
            + '\n}}'
        );
    });

    test('Handles missing pre-request script', () => {
        getRequest.events.clear();

        target.from(getRequest)
            .appendPreRequestScript();

        const actual = target.toString();

        expect(actual).toBe('');
    });

    test('Ignores empty pre-request script', () => {
        getRequest.events.clear();

        const event1 = new Event({ listen: 'prerequest', script: { exec: [''] } });
        getRequest.events.add(event1);

        target.from(getRequest)
            .appendPreRequestScript();

        const actual = target.toString();

        expect(actual).toBe('');
    });

    test('Adds unknown pre-request script commented out', () => {
        getRequest.events.clear();

        const event1 = new Event({ listen: 'prerequest', script: { exec: ['console.log("something");'] } });
        getRequest.events.add(event1);

        target.from(getRequest)
            .appendPreRequestScript();

        const actual = target.toString();

        expect(actual).toBe('\n\n{{'
            + '\n// TODO: Fixup Postman pre-request script'
            + '\n// console.log("something");'
            + '\n}}'
        );
    });

    test('Adds separator if condition is met', () => {
        target.from(getRequest)
            .includeSeparatorIf(true);

        const actual = target.toString();

        expect(actual).toBe('\n\n\n');
    });

    test('Adds separator if target item has changed', () => {
        target.from(getRequest)
            .appendName()
            .from(getRequest);

        const actual = target.toString();

        expect(actual).toBe('### Get Comment\n\n\n');
    });

    test('Builds output in order', () => {
        getRequest.events.clear();

        const event1 = new Event({ listen: 'test', script: { exec: ['console.log("something");'] } });
        getRequest.events.add(event1);

        const event2 = new Event({ listen: 'prerequest', script: { exec: ['console.log("something");'] } });
        getRequest.events.add(event2);

        getRequest.request.url = new Url('http://host.com?color=red');
        getRequest.request.body = new RequestBody({ mode: 'json', raw: '{ "some": "value" }' });

        target.from(getRequest)
            .build();

        const actual = target.toString();

        expect(actual).toBe('### Get Comment'
            + '\n'
            + '\n{{'
            + '\n// TODO: Fixup Postman pre-request script'
            + '\n// console.log("something");'
            + '\n}}'
            + '\n'
            + '\nGET host.com'
            + '\n    ?color=red'
            + '\nContent-Type: application/json'
            + '\n'
            + '\n{ "some": "value" }'
            + '\n'
            + '\n{{'
            + '\n// TODO: Fixup Postman test script'
            + '\n// console.log("something");'
            + '\n}}'
        );
    });
});