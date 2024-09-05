var fs = require('fs'), // needed to read JSON file from disk
pretty = function (obj) { // function to neatly log the collection object to console
  return require('util').inspect(obj, {colors: true});
},
Collection = require('postman-collection').Collection,
	myCollection;


const repl = require('repl');

// Load a collection to memory from a JSON file on disk (say, sample-collection.json)
myCollection = new Collection(JSON.parse(fs.readFileSync('..\\Eris.Compose\\postman\\Eris.postman_collection.json').toString()));

// log items at root level of the collection

myCollection.variables.each(function(variable) {
  if(variable.value.length < 500) {
    console.log(`@${variable.key} = ${variable.value}`);
  }
  else {
    // TODO: load value from file?
  }
})

console.log();

var cnt = 1;
myCollection.items.each(function(item) {
    // console.log(item);

    item.items.each(function(member) {
      var request = member.request;
      var prerequest = member.events.members.find((event) => (event.listen == 'prerequest'));
      var test = member.events.members.find((event) => (event.listen == 'test'));

      console.log(`### ${member.name}`);
      console.log(`# @name request${cnt}`);

      if (request === undefined) {
        return;
      }

      if(prerequest && prerequest.script.exec[0] != '') {
        console.log(`{{\n${prerequest.script.exec.join("\n")}\n}}\n`);
      }
      console.log(`${request.method} ${request.url.toString()}`);
      // if(request.headers) {
        console.log(request.headers.toString());
      // }
      if(request.body) {
        console.log(request.body.raw);
      }

      if(test && test.script.exec[0] != '') {
        console.log(`{{\n${test.script.exec.join("\n")}\n}}\n`);
      }
      console.log();
      cnt++;

      // pry = require('pryjs')
      // eval(pry.it)

      // console.log(member);
      // throw '';
    })
})
