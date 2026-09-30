document.addEventListener("DOMContentLoaded", () => {
    const isDarkMode = initTheme();

    document.body.appendChild(createThemeToggle(isDarkMode));
    insertLogoBeforeSearch(createLogo());
    updateDocumentationLinks();
});

const THEME = {
    DARK: "dark",
    LIGHT: "light",
    STORAGE_KEY: "theme",
    DARK_ICON: "moon.png",
    LIGHT_ICON: "bulb_color.png"
};

const BITBUCKET_BASE = "https://gitlab.opencode.de/lgvhh/urban-data-solutions/masterportal/";
const BITBUCKET_SRC_PATH = "src/dev/src/";

function initTheme () {
    const isDark = localStorage.getItem(THEME.STORAGE_KEY) === THEME.DARK;

    if (isDark) {
        document.body.classList.add("dark-mode");
    }
    return isDark;
}

function createThemeToggle (initialDark) {
    const button = document.createElement("button");

    button.id = "theme-toggle";

    const icon = document.createElement("img");

    icon.src = initialDark ? THEME.LIGHT_ICON : THEME.DARK_ICON;
    icon.alt = "Toggle theme";

    button.appendChild(icon);

    button.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");

        localStorage.setItem(THEME.STORAGE_KEY, isDark ? THEME.DARK : THEME.LIGHT);
        icon.src = isDark ? THEME.LIGHT_ICON : THEME.DARK_ICON;
    });

    return button;
}

function createLogo () {
    const logo = document.createElement("img");

    logo.src = "mp_logo.png";
    logo.alt = "Masterportal Logo";
    logo.id = "doc-logo";
    return logo;
}

function insertLogoBeforeSearch (logo) {
    const search = document.querySelector("nav input");

    if (search) {
        search.parentNode.insertBefore(logo, search);
    }
}

function convertLinksToBitbucketUrl (href) {
    const match = href.match(/^(.*)\.(vue|js)\.html(?:#line(\d+))?$/);

    if (!match) {
        return href;
    }

    const [, path, ext, line] = match;
    const file = path.replace(/_/g, "/") + "." + ext;
    let url = `${BITBUCKET_BASE}${BITBUCKET_SRC_PATH}${file}`;

    if (line) {
        url += `#lines-${line}`;
    }

    return url;
}

function updateDocumentationLinks () {
    document.querySelectorAll("a[href$=\".html\"], a[href*=\".html#line\"]").forEach(link => {
        link.href = convertLinksToBitbucketUrl(link.getAttribute("href"));
        link.target = "_blank";
    });
}
