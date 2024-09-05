import { writeFileSync, readFileSync } from 'fs';
import { Collection } from 'postman-collection';

const sourcePostmanCollectionPath = '..\\Eris.Compose\\postman\\Eris.postman_collection.json';
const sourcePostmanCollection = JSON.parse(readFileSync(sourcePostmanCollectionPath).toString());

const sourceCollection = new Collection(sourcePostmanCollection);

var cnt = 1;
for (let item of sourceCollection.items.all()) {
    console.log(item.name);
    console.log(item);
    for (let subItem of item.events.all()) {
        console.log(subItem.name);
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
    }
}