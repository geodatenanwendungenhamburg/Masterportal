import path from "path";
import fs from "fs";

export const directoryListing = {
    name: "directory-listing",
    configureServer (server) {
        server.middlewares.use((req, res, next) => {
            if (!req.url) {
                next();
                return;
            }

            const requestedPath = path.join(process.cwd(), req.url);

            if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
                const files = fs.readdirSync(requestedPath).filter(file => !file.startsWith(".")),
                    currentDir = decodeURIComponent(req.url === "/" ? "/" : path.basename(req.url)),

                    html = generateHTML(currentDir, files, req.url);

                res.setHeader("Content-Type", "text/html");
                res.end(html);
                return;
            }

            next();
        });
    }
};

/**
 *
 */
function generateHTML (currentDir, files, baseUrl) {
    const fileListHTML = files
        .map(file => {
            const filePath = path.join(baseUrl, file, "/");

            return `<li data-name="${file.toLowerCase()}"><a href="${filePath}">${file}</a></li>`;
        })
        .join("");

    return `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                    body {
                        margin: 20px;
                        font-family: Arial, sans-serif;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                    }

                    .header h1 {
                        margin: 0;
                        flex: 1;
                        text-align: left;
                        font-size: 24px;
                    }

                    #searchInput {
                        padding: 10px;
                        font-size: 16px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        max-width: 300px;
                    }

                    @media (max-width: 480px) {
                        .header {
                            flex-direction: column;
                            align-items: stretch;
                        }

                        #searchInput {
                            margin-top: 15px;
                            max-width: 100%;
                        }
                    }

                    .file-list {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 25px;
                        list-style: none;
                        padding: 0 40px;
                        margin: 0 auto;
                        max-width: 1400px;
                        box-sizing: border-box;
                    }

                    .file-list li {
                        padding: 16px;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        background-color: #fafafa;
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                        transition: transform 0.2s ease;
                        font-size: 16px;
                    }

                    .file-list li:hover {
                        transform: translateY(-2px);
                    }

                    .file-list li a {
                        display: block;
                        color: #333;
                        font-weight: 500;
                        text-decoration: none;
                        word-break: break-word;
                    }

                    .file-list li a:hover {
                        color: #007BFF;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>~ / ${currentDir} /</h1>
                    <input type="text" id="searchInput" placeholder="Search files..." />
                </div>
                <ul class="file-list">
                    ${fileListHTML}
                </ul>
                <script>
                    const input = document.getElementById('searchInput');
                    const items = document.querySelectorAll('.file-list li');

                    input.addEventListener('input', () => {
                        const query = input.value.toLowerCase();

                        items.forEach(item => {
                            const name = item.getAttribute('data-name');
                            item.style.display = name.includes(query) ? '' : 'none';
                        });
                    });
                </script>
            </body>
        </html>
    `;
}
