"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RequestDefinitionBuilder_1 = require("../RequestDefinitionBuilder");
var postman_collection_1 = require("postman-collection");
var fs_1 = require("fs");
describe('Request Definition Builder', function () {
    var sourcePostmanCollection = JSON.parse((0, fs_1.readFileSync)('sample.postman_collection.json').toString());
    var sourceCollection = new postman_collection_1.Collection(sourcePostmanCollection);
    var rootGroup = sourceCollection.items.all().at(0);
    var v1Group = rootGroup.items.all().at(0);
    var getRequest = v1Group.items.all().at(0);
    test('Request line is split', function () {
        getRequest.request.url = new postman_collection_1.Url('http://host.com?color=red');
        var target = new RequestDefinitionBuilder_1.RequestDefinitionBuilder()
            .from(getRequest)
            .appendRequest();
        var actual = target.toString();
        expect(actual).toBe('\n\nGET host.com/\n    ?color=red');
    });
    test('Header is added', function () {
        getRequest.request.headers.clear();
        var header = new postman_collection_1.Header('option');
        header.key = 'SomeHeader';
        header.value = 'SomeValue';
        getRequest.request.headers.add(header);
        var target = new RequestDefinitionBuilder_1.RequestDefinitionBuilder()
            .from(getRequest)
            .appendHeaders();
        var actual = target.toString();
        expect(actual).toBe('\nSomeHeader: SomeValue');
    });
    test('Multiple headers are added', function () {
        getRequest.request.headers.clear();
        var header1 = new postman_collection_1.Header('option');
        header1.key = 'SomeHeader1';
        header1.value = 'SomeValue1';
        getRequest.request.headers.add(header1);
        var header2 = new postman_collection_1.Header('option');
        header2.key = 'SomeHeader2';
        header2.value = 'SomeValue2';
        getRequest.request.headers.add(header2);
        var target = new RequestDefinitionBuilder_1.RequestDefinitionBuilder()
            .from(getRequest)
            .appendHeaders();
        var actual = target.toString();
        expect(actual).toBe('\nSomeHeader1: SomeValue1\nSomeHeader2: SomeValue2');
    });
    test('Body is added with default content-type header', function () {
        getRequest.request.body = new postman_collection_1.RequestBody({ mode: 'json', raw: '{ "some": "value" }' });
        var target = new RequestDefinitionBuilder_1.RequestDefinitionBuilder()
            .from(getRequest)
            .appendBody();
        var actual = target.toString();
        expect(actual).toBe('\nContent-Type: application/json\n\n{ "some": "value" }');
    });
});
//# sourceMappingURL=RequestDefinitionBuilder.test.js.map