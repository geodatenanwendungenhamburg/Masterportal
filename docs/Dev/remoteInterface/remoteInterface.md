# Remote Interface



The remote interface allows programmatic interaction with the Masterportal. It gives access to all registered VueX actions and a set of dedicated additional functions.

## Generic remote interface to call VueX actions

|Name|Type|Explanation|
|-|-|-|
|namespace|String|Namespace of VueX module|
|action|String|Name of action to call on module|
|args|Object|Parameter object provided as payload to action|

### Example
Any VueX action may be called as follows:

```js
const myIframe = document.getElementById("my-iframe");
myIframe.contentWindow.postMessage({
    namespace: "Name/Space/Of/VueX/Store",
    action: "nameOfAction",
    args: {
        "param1": "value1",
        "paramX": "valueX"
    }
});
```

The remote interface will interpret the message given and produce the following call:

```js
store.dispatch(
    "Name/Space/Of/VueX/Store/nameOfAction",
    {
        "param1": "value1",
        "paramX": "valueX"
    },
    { root: true }
);
```
