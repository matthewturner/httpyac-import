# postman2httpyac

CLI script to convert a postman collection to httpyac file or files.

## Request Lines

Request lines will be parsed and split onto multiple lines:

```
GET https://www.google.de?option=value
```

Will be output as:

```
GET https://www.google.de
    ?option=value
```

## Test Scripts

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

More complicated assertions will be output commented out and marked with a TODO:

```javascript
pm.test("Status test", function () {
    pm.response.to.have.status(201);
    pm.environment.set("someId", pm.response.json().id);
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