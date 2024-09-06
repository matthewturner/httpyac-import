import { writeFileSync, readFileSync } from 'fs';
import { Collection, ItemGroup, Item, PropertyList } from 'postman-collection';
import { parse } from 'ts-command-line-args';
import { IOptions } from './options'

const args = parse<IOptions>({
    sourcePath: { type: String, optional: true as const }
});

const sourcePostmanCollectionPath = args.sourcePath.toString();
const sourcePostmanCollection = JSON.parse(readFileSync(sourcePostmanCollectionPath).toString());

const sourceCollection = new Collection(sourcePostmanCollection);

function processItems(items : PropertyList<Item | ItemGroup<Item>>) {
    for (const item of items.all()) {
        if (item instanceof Item) {
            processItem(item);
            continue;
        }

        const propertyGroup = <ItemGroup<Item>>item;
        processItems(propertyGroup.items);
    }
}

function processItem(item : Item) {
    console.log(`### ${item.name}`);
    console.log('');
    console.log(`${item.request.method} ${item.request.url}`);
    console.log('');
}

processItems(sourceCollection.items);

// var cnt = 1;
// for (const item of sourceCollection.items.all()) {
//     const propertyGroup = <ItemGroup<Item>>item;
//     for (const subItem of propertyGroup.items.all()) {
//         console.log(subItem.name);
        // var request = member.request;
        // var prerequest = member.events.members.find((event) => (event.listen == 'prerequest'));
        // var test = member.events.members.find((event) => (event.listen == 'test'));

        // console.log(`### ${member.name}`);
        // console.log(`# @name request${cnt}`);

        // if (request === undefined) {
        //     return;
        // }

        // if (prerequest && prerequest.script.exec[0] != '') {
        //     console.log(`{{\n${prerequest.script.exec.join("\n")}\n}}\n`);
        // }
        // console.log(`${request.method} ${request.url.toString()}`);
        // // if(request.headers) {
        // console.log(request.headers.toString());
        // // }
        // if (request.body) {
        //     console.log(request.body.raw);
        // }

        // if (test && test.script.exec[0] != '') {
        //     console.log(`{{\n${test.script.exec.join("\n")}\n}}\n`);
        // }
        // console.log();
        // cnt++;
//     }
// }