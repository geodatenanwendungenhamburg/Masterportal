import path from "path";
import fs from "fs";

export default (options) => ({
    name: "html-ext-fallback",
    configureServer (server) {
        // console.log("[html-ext-fallback] Plugin initialized");

        server.middlewares.use((req, res, next) => {
            const originalUrl = req.url;
            let cleanUrl = originalUrl.split("?")[0].split("#")[0];

            if ((/^\/(portal|portalconfigs)\//).test(cleanUrl) && !path.extname(cleanUrl)) {

                if (!(/\/$/).test(cleanUrl)) {
                    // console.log("[Middleware] no slash");
                    const queryAndHash = originalUrl.substring(cleanUrl.length);

                    cleanUrl += "/";
                    res.writeHead(301, {
                        Location: `${cleanUrl}${queryAndHash}`
                    });
                    res.end();
                    return;
                }
                // console.log("[Middleware] has slash");


                // console.log(`[Middleware] Clean URL: ${cleanUrl}`);

                const normalizedRootDir = options.rootDir.includes("devtools")
                        ? options.rootDir.replace(/devtools[\\/]?/g, "")
                        : options.rootDir,

                    // console.log(`[Middleware] Normalized rootDir: ${normalizedRootDir}`);

                    indexHtmlPath = path.join(normalizedRootDir, cleanUrl, "index.html");

                // console.log(`[Middleware] Checking path: ${indexHtmlPath}`);
                // console.log(fs.existsSync(indexHtmlPath));

                if (fs.existsSync(indexHtmlPath)) {
                    const newUrl = path.posix.join(cleanUrl, "index.html");

                    // console.log(`[Middleware] Found index.html, rewriting URL to: ${newUrl}`);
                    // console.log(`[Middleware] Found index.html, old: ${req.url}`);
                    req.url = newUrl;
                }
            }

            next();
        });
    }
});
