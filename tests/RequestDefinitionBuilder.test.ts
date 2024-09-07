import { RequestDefinitionBuilder } from '../src/RequestDefinitionBuilder';
import { Item, ItemGroup, Collection, Url } from 'postman-collection';
import { readFileSync } from 'fs';

describe('Request Definition Builder', () => {
    const sourcePostmanCollection = JSON.parse(readFileSync('sample.postman_collection.json').toString());
    const sourceCollection = new Collection(sourcePostmanCollection);

    const rootGroup = <ItemGroup<Item>>sourceCollection.items.all().at(0);
    const v1Group = <ItemGroup<Item>>rootGroup.items.all().at(0);
    const getRequest = <Item>v1Group.items.all().at(0);

    test('Request line is split', () => {
        getRequest.request.url = new Url('http://host.com?color=red')

        const target = new RequestDefinitionBuilder()
            .from(getRequest)
            .appendRequest();

        const actual = target.toString();

        expect(actual).toBe('\n\nGET host.com/\n    ?color=red');
    });
});