# httpyac-import

CLI to convert a postman collection to httpyac file or files.

## Usage
`httpyac-import --sourcePath=sample.postman_collection.json --targetPath=output`

* sourcePath - path to the postman collection json file
* targetPath - path to the root of the .http files, will be created if it doesn't exist
* ignoreHeaders - optional list of headers to ignore, useful when using default headers. Supports regex patterns

## Request Lines

Request lines are parsed and split onto multiple lines:

```
GET https://www.google.de?option=value
```

Will be output as:

```
GET https://www.google.de
    ?option=value
```

## Scripts

### Pre-request Scripts

All pre-request scripts will be commented out and marked with a TODO:

```javascript
console.log('Some pre-request script');
```
Will be converted to:

```
{{
// TODO: Fixup Postman pre-request script
// console.log('Some pre-request script');
}}
```

### Test Scripts

The utility attempts to convert the basic post-request test scripts to the httpyac equivalent:

Given a simple status test:

```javascript
pm.test("Status test", function () {
    pm.response.to.have.status(201);
});
```

Will be converted to the concise httpyac equivalent:

```
?? status == 201
```
Two more known patterns will be converted to the the httpyac equivalent:

```javascript
pm.test("Status test", function () {
    pm.response.to.have.status(201);
    pm.environment.set("someId", pm.response.json().id);
    pm.environment.set("someEtag", pm.response.headers.get("Etag"));
});
```
Will be converted to:

```
?? status == 201

{{
    $global.someId = response.parsedBody.id;
    $global.someEtag = response.headers.etag;
}}
```

More complicated assertions will be commented out and marked with a TODO:

```javascript
pm.test("Status test", function () {
    pm.response.to.have.status(201);
    console.log(pm.response.json().id);
});
```
Will be converted to:

```
?? status == 201

{{
// TODO: Fixup Postman test script
// pm.test("Status test", function () {
//    pm.response.to.have.status(201);
//    pm.environment.set("someId", pm.response.json().id);
//});
}}
```

## Limitations

There is no current support for:

* Non-javascript scripting languages
* Non-JSON body in POST/PUT requests

## Known Issues
* Mandatory parameters - the sourcePath and targetPath should be mandatory but [ts-command-line-args ](https://www.npmjs.com/package/ts-command-line-args) seems to demand they be set as optional

## Running from the repository
`npm run import -- -- --sourcePath=sample.postman_collection.json --targetPath=output`
