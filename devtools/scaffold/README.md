# Masterportal Addon Scaffold

This guide explains how to generate and install a new addon using the Masterportal Scaffold tool.


## 1. Generate a New Addon

Run the following command in your Masterportal root directory:

```bash
node devtools/scaffold/scaffold.js demoAddon
```

This creates a new addon in `dist_scaffold/addons/demoAddon/`.


## 2. Copy the Addon to the Addons Folder

```bash
cp -R dist_scaffold/addons/demoAddon/ addons/
```


## 3. Register the Addon in `addonsConf.json`

Add the following entry to `addons/addonsConf.json`:

```json
// addons/addonsConf.json
"demoAddon": {
  "type": "tool"
},
```


## 4. Enable the Addon in the Portal Configuration

**In `portal/your-portal/config.js`:**

```js
addons: ["demoAddon"],
```

**In `portal/your-portal/config.json`:**

```json
{
  "secondaryMenu": {
    "sections": [
      [
        { "type": "demoAddon" }
      ]
    ]
  }
}
```


## 5. Restart the Development Server

After updating all configurations, restart the server:

```bash
npm run start
```

Visit `/portal/your-portal/` in your browser to see the new addon in the secondary menu.


## 6. Run the unit tests

Test your addon.

```bash
npm run test:single:watch addons/demoAddon/tests/
```

## 7. Clean Up

After completing the installation, you can safely delete `addons/demoAddon/ADDON_INSTALLATION.md` from your new addon, as it is no longer needed.
