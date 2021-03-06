# oe-common-mixins


- [Introduction](#introduction)
  * [dependency](#dependency)
  * [Getting Started](#getting-started)
    + [Testing and Code coverage](#testing-and-code-coverage)
    + [Installation](#installation)
- [Audit Field Mixin](#audit-field-mixin)
  * [Using AuditFieldMixin](#using-auditfieldmixin)
    + [Loading Mixin using model-config.json](#loading-mixin-using-model-configjson)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically)
  * [Developer Considerations](#developer-considerations)
- [Version Mixin](#version-mixin)
  * [Using VersionMixin](#using-versionmixin)
    + [Loading VersionMixin using model-config.json](#loading-versionmixin-using-model-configjson)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson-1)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically-1)
  * [Developer Considerations](#developer-considerations-1)
  * [EmbedsOne Relation](#embedsone-relation)
    + [POST - create parent record](#post---create-parent-record)
    + [PUT - Update parent record](#put---update-parent-record)
    + [PUT - Updating embedded record](#put---updating-embedded-record)
- [Soft Delete Mixin](#soft-delete-mixin)
  * [Using SoftDeleteMixin](#using-softdeletemixin)
    + [Loading Mixin using model-config.json](#loading-mixin-using-model-configjson-1)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson-2)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically-2)
  * [Developer Considerations](#developer-considerations-2)
- [Crypto Mixin](#crypto-mixin)
  * [Using Cryto Mixin](#using-cryto-mixin)
    + [Loading Crypto Mixin using model-config.json](#loading-crypto-mixin-using-model-configjson)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson-3)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically-3)
  * [Configuration](#configuration)
  * [Design](#design)

# Introduction

oeCloud mixin is functionality which can be declaratively attached to Model as **mixins** property. This module implements most commonly used functionalities which can be attached to models. These functionalities are

* Version Mixin
* Audit Field Mixin
* Soft Delete Mixin
* History Mixin
* Crypto Mixin


## dependency

* oe-cloud
* oe-logger


## Getting Started

In this section, we will see how we can use install this module in our project. To use any of mixins/functionality in project from this module, you must install this module.


### Testing and Code coverage

```sh
$ git clone https://github.com/EdgeVerve/oe-common-mixins.git
$ cd oe-common-mixins
$ npm install --no-optional
$ npm run grunt-cover
```

you should see coverage report in coverage folder.


### Installation

To use **AuditFieldMixin** in your project, you must include this package into your package.json as shown below. So when you do **npm install** this package(oe-common-mixins) will be made available. Please ensure the source of this package is right and updated. Also, please note that, to use this mixin, your project must be **oeCloud** based project.


```javascript
"oe-common-mixins": "git+http://<gitpath>/oe-common-mixins.git#2.0.0"
```

You can also install this mixin on command line using npm install.


```sh
$ npm install <git path oe-common-mixins> --no-optional
```

# Audit Field Mixin

When application creates records in Model or updates records in Model, as a developer, you may want to know who has originally created record. Or you may want to know who has last updated this record. You want to know when record was created or when record was modified. All these information we call it Auditing information. oeCloud has ability to maintain this information in same Model. All programmer has to do is to attach this **mixin** to model and oeCloud will maintain this information. This way, at any point of time, you will always know when record was crated, who created that record and when it was last updated by whom.


## Using AuditFieldMixin


To use **AuditFieldMixin** you must load this mixin into your application. Usually this happens during boot of the application. There are several ways to configure mixin paths for your application. You can do it declaratively or you can do it programatically.

**AuditFieldMixin** creates following properties to Model where it is attached to.

* _createdBy : who has created this record. This information is taken from context. If it is http request, it is usually logged in user id. If it is called by JavaScript API, you can explicitly assign userId to ctx.remoteUser in options. This field is touched only when record is created.
* _modifiedBy : this is very similar to _createdBy field except it is updated for update and create operation.
* _createdOn : When record is created. This is server's date time where application is running and not database time.
* _modifiedOn : Same as above exept it will be populated during update and create operations.


### Loading Mixin using model-config.json

In application's model-config.json, you can have entry for mixin directory as shown below. This way mixin will be loaded as part of boot script.


```javascript
"_meta": {
        "sources": [
          ...
            "../server/models",
            "../common/models",
            "./models",
          ...
        ],
        "mixins": [
        ...
            "../common/mixins",
            "./mixins"
            "oe-common-mixins/common/mixins"
        ...
        ]
    },
```

As shown above, oe-common-mixins's mixin path is declared in application. Once this is done, you can **assign** this mixin to the model you want as shown below.

```javascript
{
  "name": "Customer",
  "base": "BaseEntity",
  "properties": {
    "name": {
      "type": "string",
      "unique" : true
    }
    ...
  },
  "mixins" : {
      "AuditFieldMixin" : true
  }
}
```

This will add **AuditFieldMixin** functionality to Customer model. It means that, whenever a record is created or modified, audit fields are populated.


### Loading Mixin using app-list.json

This is most ideal and preferred way of loading any oe cloud node module in application. This guarantees all functionality applies to application and programmer doesn't need to do any extra coding or declarations.

app-list.json is application's module file which is loaded as part of boot. oeCloud goes through this file and load modules in sequence as given in app-list.json. It also applies mixins in module, run boot scripts, loads middlewares and so on.

This feature applies mixins to **BaseEntity** model - which is usually **base** model for all the models in oeCloud based application. Thus mixin applies on BaseEntity is also available in your model.

Application developer should have following in app-list.json. This will attach all the mixins available in **oe-common-mixins** to BaseEntity.

```javascript
...
  {
    "path": "oe-common-mixins",
    "enabled": true
  },
...
```

If you want only **AuditFieldMixin** to be enabled by default, then you can have app-list.json entry as below.

```javascript
...
  {
    "path": "oe-common-mixins",
	"AuditFieldMixin" : true,
	"VersionMixin" : false,
	"SoftDeleteMixin" : false,
	"HistoryMixin" : false,
    "enabled": true
  },
...
```

**Note** : This is ideal way of loading mixin.

### Loading Mixin pragmatically

Imagine that you are developing oe cloud node module. That has got some Model and you want only   **AuditFieldMixin** applied to your model. You don't want application developer to add app-list.json entry. In short, you don't want application developer even aware of oe-common-mixins module. In this scenario, you have responsibility to load the module. **oe-common-mixin** can be loaded programatically as shown below. Ensure that you have dependency added in your module's **package.json** file.

* In your index.js file of module (index.js should be first file loaded by oeCloud), write following code. And your model, ensure that "mixins" property has **AuditFieldMixin** value set to true.

```javascript
const commonMixins = require('oe-common-mixins');
commonMixin();
```

* Other way to load common mixins is in your index.js file, wait till all modules are loaded and then load commonMixins

```javascript
oecloud.observe('loaded', function (ctx, next) {
	const commonMixins = require('oe-common-mixins');
	commonMixin(ctx);
    return next();
})
```

## Developer Considerations

* AuditFieldMixin operates on context information of remoteUser. For http request, this information is populated in context based on AccessToken. If this information is not available, then remote user will be set to **system**.
* When call is made from JavaScript code, you either have to pass remoteUser in context or this mixin will set **createdBy** and **updatedBy** to **system**


# Version Mixin

Enterprise application should always handle concurrency gracefully. There will be always cases where more than one user is updating same record at same time. That cause data inconsistency. For example, let us consider case where there are two requests to increase account balance. One request needs to increase balance by 100 and other request would increase balance by 200. Ideally after both requests are **successfully** processed, Account balance should be increased by 300. Assume that initial balance in account was 500.

Consider following scenario
- Request1 reads balance as 500
- Request2 reads balance as 500
- Request1 update balance to 500+100 = 600 and sets balance to 600
- Request2 updates balance to 500+200 = 700 and sets balance to 700

Both requests are successfully executed but new balance is not right.

To avoid this, VersionMixin plays important role.
* Version mixin maintains the version of each record.
* When record gets updated, _version field changes to new value
* Programmer / caller must always has to pass current version for update operation
* Since for every update version gets change, above issue is prevented. In that scenario, request2 would get error as version mismatch.


## Using VersionMixin


To use **VersionMixin** you must load this mixin into your application. Usually this happens during boot of the application. There are several ways to configure mixin paths for your application. You can do it declaratively or you can do it pragmatically.

**VersionMixin** creates following properties to Model where it is attached to.

* _version : This property maintains current version of the record.
* _oldVersion : This property maintains previous version of record.
* _newVersion : This property is temporarily used to give newVersion value explicitly by caller


### Loading VersionMixin using model-config.json

Please refer to above section for *AuditFieldMixin**

### Loading Mixin using app-list.json

Please refer to above section for *AuditFieldMixin**


### Loading Mixin pragmatically

Please refer to above section for *AuditFieldMixin**

## Developer Considerations

* Version mixin ensures that _version value is given for any update and delete operation. It has changes deleteById http end point by adding version field to it. Therefore, http end point to delete a record would be

```
  DELETE http://localhost:3000/api/customers/<id>/<version>
```

This way, when you call model.destroyById, you will have to call .destroyById method by passing version

```javascript
model.destroyById(<id>, <version>, options, function(err, result){
  // see results here
});
```

This can be confusing because for some models you will pass version while deleting and for some models, you will not pass as VersionMixin was not enabled for those models.

* If programmer calls updateAll method in javascript, version checking would not be possible as multiple records are getting updated. For such models where version mixin is enabled, you should disable updateAll method. If it is not disabled or it is somehow gets called, concurrent update of same records could be possible.

## EmbedsOne Relation
When model is Embedded, version mixin behavior is little different and you need to take care of special case.

### POST - create parent record

When you are creating record in parent model and passing data of embedded model along, you don't have to worry about anything special. 

Once record is created in parent model, _version will automatically generated and same _version field will be populated for both parent and embedded record. Response of such request will look like

POST /api/Books 
```
{
  "name": "a",
  "id": "a",
  "_isDeleted": false,
  "_version": "679d0579-67d2-4e12-83a1-f1c8c20981c9",
  "publisher": {
    "name": "a",
    "age": 0,
    "id": "a",
    "_isDeleted": false,
    "_version": "679d0579-67d2-4e12-83a1-f1c8c20981c9"
  }
}
```
**Validation** : Child record and parent record both are validated. 

### PUT - Update parent record

For this operation, _version field must be populated in your request body. _version must be existing version of the existing record that you are trying to modify. 
If no record with _version is found then oecloud will throw error. 

PUT /api/Books/a
```
{
 "name": "a-changed",
  "id": "a",
  "_version": "679d0579-67d2-4e12-83a1-f1c8c20981c9"
}
```
Response

```
{
  "name": "a-changed",
  "id": "a",
  "_isDeleted": false,
  "_oldVersion": "679d0579-67d2-4e12-83a1-f1c8c20981c9",
  "_version": "c289c6d2-4bdc-482a-8adc-76d215a402f5",
  "publisher": {
    "name": "a",
    "age": 0,
    "id": "a",
    "_isDeleted": false,
    "_version": "679d0579-67d2-4e12-83a1-f1c8c20981c9"
  }
}
```
Note that only parent record's _version is updated with new version. This will make _version field in embedded model and parent model go **out of sync**.

**Validation** : only parent data is validated. 

### PUT - Updating embedded record

This is tricky operation. Here you want to just update embedded model record. But since embedded data is not residing in separate collection (or table), you are really modifying parent record. Therefore you need to supply parent record's version as well as child record's version. Parent record's version is supplied in _parentVersion field.

/api/Books/a/personRel
```
{
  "name": "publsher updatted",
  "age": 11,
  "id": "n",
  "_version": "679d0579-67d2-4e12-83a1-f1c8c20981c9",
  "_parentVersion" :"c289c6d2-4bdc-482a-8adc-76d215a402f5"
}
```
As you can see above, you will see both _version and _parentVersion is supplied. This becomes important because parent record's version and embedded record version went out of sync.

However when both are in 'sync', you may either supply only _parentVersion or _version. 
However it is good practice to supply both of these fields.

Response of such request will look like

```
{
  "name": "publsher updatted",
  "age": 11,
  "id": "n",
  "_isDeleted": false,
  "_version": "486c7ea9-f1b6-413a-afdf-64210e72e81e",
  "_parentVersion": "c289c6d2-4bdc-482a-8adc-76d215a402f5"
}
```
if you go to database, you will find _version field of both parent and embedded record is same.

**Validation** : All fields in embedded model are validated. However _version is validated for parent Model also. **before save** hooks on embedded Model and parent model are called.


**Embedded model without Version Mixin**
In above examples, we have assumed that embedded model will too have VersionMixin enabled. But if that is not the case, then it will not be possible to pass _parentVersion as **strict** flag on model is true by default.




# Soft Delete Mixin

In typical Enterprise application, data never gets deleted. Data always invalidated or **soft deleted**. In oeCloud application, when you call model.deleteById or model.destroyAll, oeCloud would **hard** delete data permentantly from database. To avoid that, this mixin functionality comes into picture. If on model, if you have enabled this **SoftDeleteMixin=true**, data from that Model will never gets deleted permanently. Instead, SoftDeleteMixin would maintain a flag named **_isDeleted**. This flag is set to true for the record which is deleted. When user calls .destroyById() or .destroyAll(), this functionality ensures that records are not deleted but they are updated with _isDeleted is set to true for those records.

When application retrieves records using model.find() method, this mixin adds filter _isDeleted = false to ensure that deleted records are never fetched.

## Using SoftDeleteMixin

**SoftDeleteMixin** adds following field to the Model schema

_isDeleted : Default value of this field (or property) is false. When application deletes the record, this value is set to true


### Loading Mixin using model-config.json

Please refer to above section for *AuditFieldMixin**

### Loading Mixin using app-list.json

Please refer to above section for *AuditFieldMixin**


### Loading Mixin pragmatically

Please refer to above section for *AuditFieldMixin**

**Note** : Usually app-list.json way of loading is prefereed.

## Developer Considerations

* Soft Delete feature works properly when you are deleting single instance. It wraps **destroyAll** method of connector and then calls **update** method of connector and thus prevent default behavior of deleting records.
* This technique can cause unwanted behavior. For example, if programmer wants to handle observer hook of connector (see below code snippet), data received in context would not be appropriate.

```javascript
Model.destroyById(id, options, function(err, result){
  // get results of delete operation
});

connector.observe("execute", function(ctx, next){
  // ctx.req,sql - you will find "update" query when you were expecting "delete"
  return next();
})
```

* Soft Delete Mixin with Version mixin is also tricky. When you are deleting more than one record at time (using model.destroyAll()), it gets converted into "update" method. For all the records, this module will set _isDeleted=true and version value of all those updated records will be same.

# Crypto Mixin

In cryptography, encryption is the process of encoding messages or information in such a way that only authorized parties can read it. Encryption does not prevent interception, but denies the message content to the interceptor. In an encryption scheme, the intended communication information or message, referred to as plaintext, is encrypted using an encryption algorithm, generating ciphertext that can only be read if decrypted. An authorized recipient can easily decrypt the message with the key provided by the originator to recipients, but not to unauthorized interceptors.

In the oeCloud.io based application, it is possible to encrypt "data at rest".
With this feature, you can declare a model property to be persisted in an encrypted manner in the database. Meaning, for example, you can have model called CreditCard and you can save actual credit card number in encrypted form itself in database.


## Using Cryto Mixin

To use **Crypto Mixin** you must load this mixin into your application. Usually this happens during boot of the application. There are several ways to configure mixin paths for your application. You can do it declaratively or you can do it programatically. That is described in section below.

To enable mixin on model and to enable to store data in encrypted form, you must add **encrypt** flag to true for the property for which you want to encrypt.
This is enabled by adding a "encrypt" : true  flag to model properties while defining the model along with enabling "CryptoMixin". An example is shown below:

```
{
    "properties": {
      "ccno": {
        "type": "string",
        "encrypt": true
      },
      "amt": {
        "type": "number"
      }
    },
    "mixins": {
      "CryptoMixin": true
    },
    "name": "BBModel",
    "description": "BBModel",
    "plural": "BBModels",

  }

```

Upon retrieval of the data (using find / findById etc., ) the response will contain the decrypted data.


### Loading Crypto Mixin using model-config.json

Please refer to above section for *AuditFieldMixin**

### Loading Mixin using app-list.json

Please refer to above section for *AuditFieldMixin**

### Loading Mixin pragmatically

Please refer to above section for *AuditFieldMixin**

**Note** : Usually app-list.json way of loading is prefereed.

## Configuration
The encryption algorithm is configurable via config.json.
Two related config params are added to config.json: encryptionAlgorithm and encryptionPassword.
Application level config parameters are prioritized over foundation level ones.
Currently the following values are allowed for encryptionAlgorithm:
* crypto.aes256
* crypto.aes-256-ctr  (default)
* crypto.aes-256-cbc
* crypto.aes128
* crypto.aes192

These are defined under the "crypto" function in lib/encryption.js, hence the "crypto." prefix.
More algorithms can be easily added to encryption.js. You just have to define one function in it and export it.

## Design
The implementation is done in common/mixin/crypto-mixin.js
The algorithms are picked up from lib/encryption.js.
The implementation also depends on a change done in loopback-datasource-juggler – an implementation of an “after access” hook.
**Drawback**: Tne drawback of this implementation is that you can’t query on encrypted fields in the database. This ability may not fit your requirement.


