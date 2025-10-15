# Module Caching

Masterportal modules aren't cached by default. Each time a module is opened in the menu, it's mounted again.
Each time it's closed, it's unmounted. Every time, this results in a new instance of the module.

Module caching allows us to reuse a module component after it's closed and re-opened.

## Activate caching for a module

In order to cache a module, you must implement the following KeepAlive lifecycle hooks.

|Lifecycle hook|Description|
|--------------|-----------|
|activated()|called on initial mount and every time it is re-inserted from the cache|
|deactivated()|called every time it is re-inserted from the cache and also when unmounted|

These hooks are part of the [Vue KeepAlive](https://vuejs.org/guide/built-ins/keep-alive) feature,
which caches the component.

```js
export default {
  activated () {
    alert("KeepAlive lifecycle hook: activated");
  },
  deactivated () {
    alert("KeepAlive lifecycle hook: deactivated");
  }
}
```

It is important to remember that the `unmounted()` hook is not triggered for cached modules.

You should use the `activated()` and `deactivated()` hooks to show/hide elements,
for example any features in the map, if required.
