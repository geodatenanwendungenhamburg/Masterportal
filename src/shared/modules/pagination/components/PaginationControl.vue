<script>
export default {
    name: "PaginationControl",
    props: {
        /**
         * The current active page
         */
        currentPage: {
            type: Number,
            required: true
        },
        /**
         * The total number of pages
         */
        totalPages: {
            type: Number,
            required: true
        }
    },
    computed: {
        /**
         * Determines the visible pages in a pagination component
         * Shows previous and next page of current page as per Bootstrap standard
         * @returns {Array} An array of page numbers or placeholders that should be visible
         */
        visiblePages () {
            const pages = [],
                maxVisible = 7;

            if (this.totalPages <= maxVisible) {
                for (let i = 1; i <= this.totalPages; i++) {
                    pages.push(i);
                }
            }
            else {
                pages.push(1);

                if (this.currentPage <= 4) {
                    for (let i = 2; i <= 5; i++) {
                        pages.push(i);
                    }
                    pages.push("...");
                    pages.push(this.totalPages);
                }
                else if (this.currentPage >= this.totalPages - 3) {
                    pages.push("...");
                    for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
                        pages.push(i);
                    }
                }
                else {
                    pages.push("...");
                    pages.push(this.currentPage - 1);
                    pages.push(this.currentPage);
                    pages.push(this.currentPage + 1);
                    pages.push("...");
                    pages.push(this.totalPages);
                }
            }

            return pages;
        }
    },
    methods: {
        /**
         * Handles page change event
         * @param {Number} newPage - The new page to change to
         */
        changePage (newPage) {
            if (newPage < 1 || newPage > this.totalPages) {
                return;
            }
            this.$emit("page-change", newPage);
        }
    }
};
</script>

<template>
    <div class="pagination-controls">
        <!-- Desktop/Tablet View -->
        <nav
            aria-label="Page navigation"
            class="desktop-view"
        >
            <ul class="pagination">
                <!-- Previous Button -->
                <li
                    class="page-item"
                    :class="{ disabled: currentPage === 1 }"
                >
                    <button
                        class="page-link btn btn-pagination"
                        :aria-label="$t('common:modules.pagination.aria.previous')"
                        :disabled="currentPage === 1"
                        @click="changePage(currentPage - 1)"
                    >
                        <i class="bi bi-chevron-left" />
                    </button>
                </li>

                <!-- Page Numbers -->
                <li
                    v-for="(page, index) in visiblePages"
                    :key="`page-${index}-${page}`"
                    class="page-item"
                    :class="{
                        active: page === currentPage,
                        disabled: page === '...'
                    }"
                >
                    <button
                        v-if="page !== '...'"
                        class="page-link btn btn-pagination"
                        @click="changePage(page)"
                    >
                        {{ page }}
                    </button>
                    <span
                        v-else
                        class="page-link btn btn-pagination ellipsis"
                    >
                        ...
                    </span>
                </li>

                <!-- Next Button -->
                <li
                    class="page-item"
                    :class="{ disabled: currentPage === totalPages }"
                >
                    <button
                        class="page-link btn btn-pagination"
                        :aria-label="$t('common:modules.pagination.aria.next')"
                        :disabled="currentPage === totalPages"
                        @click="changePage(currentPage + 1)"
                    >
                        <i class="bi bi-chevron-right" />
                    </button>
                </li>
            </ul>
        </nav>

        <!-- Mobile View -->
        <nav
            aria-label="Page navigation mobile"
            class="mobile-view"
        >
            <div class="mobile-nav-container">
                <button
                    class="btn btn-pagination mobile-nav-btn"
                    :aria-label="$t('common:modules.pagination.aria.previous')"
                    :disabled="currentPage === 1"
                    @click="changePage(currentPage - 1)"
                >
                    <i class="bi bi-chevron-left" />
                </button>

                <div class="mobile-page-info">
                    <div class="current-page-display">
                        <span class="page-number">{{ currentPage }}</span>
                        <span class="page-separator">/</span>
                        <span class="total-pages">{{ totalPages }}</span>
                    </div>
                    <div class="page-dots">
                        <div
                            v-for="dot in Math.min(totalPages, 5)"
                            :key="dot"
                            class="page-dot"
                            :class="{ 'active': dot === currentPage || (totalPages > 5 && dot === 5 && currentPage >= 5) }"
                        />
                    </div>
                </div>

                <button
                    class="btn btn-pagination mobile-nav-btn"
                    :aria-label="$t('common:modules.pagination.aria.next')"
                    :disabled="currentPage === totalPages"
                    @click="changePage(currentPage + 1)"
                >
                    <i class="bi bi-chevron-right" />
                </button>
            </div>
        </nav>
    </div>
</template>

<style scoped lang="scss">
@import 'variables';

.pagination-controls {
    display: flex;
    align-items: center;
    margin: 1rem 0;
    width: 100%;
}

.desktop-view {
    display: block;
    width: 100%;

    .pagination {
        display: flex;
        flex-wrap: wrap;
        gap: 0.125rem;
        margin-bottom: 0;
        padding-left: 0;
        list-style: none;
        justify-content: center;
        align-items: center;
    }

    .page-item {
        &.disabled {
            .page-link {
                pointer-events: none;
                opacity: 0.5;
                cursor: not-allowed;
            }
        }

        &.active {
            .page-link {
                background-color: var(--bs-btn-active-bg);
                border-color: var(--bs-btn-active-border-color);
                color: var(--bs-btn-active-color);
            }
        }
    }

    .page-link {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.375rem 0.75rem;
        min-width: 2.25rem;
        height: 2.25rem;
        text-align: center;
        text-decoration: none;
        transition: all 0.2s ease-in-out;
        border: 1px solid var(--bs-btn-border-color);
        border-radius: var(--bs-btn-border-radius);
        background-color: var(--bs-btn-bg);
        color: var(--bs-btn-color);
        font-size: 0.875rem;
        line-height: 1.25;

        &.ellipsis {
            background: transparent;
            border: none;
            cursor: default;
            padding: 0.25rem 0.25rem;
            min-width: 1.5rem;

            &:hover {
                background: transparent;
                color: inherit;
            }
        }

        &:hover:not(.ellipsis):not(:disabled) {
            background-color: var(--bs-btn-hover-bg);
            border-color: var(--bs-btn-hover-border-color);
            color: var(--bs-btn-hover-color);
        }

        &:focus {
            outline: 0;
            background-color: var(--bs-btn-focus-bg);
            border-color: var(--bs-btn-focus-border-color);
            color: var(--bs-btn-focus-color);
            box-shadow: var(--bs-btn-box-shadow);
        }

        i {
            font-size: 0.875rem;
        }
    }
}

.mobile-view {
    display: none;
    width: 100%;
}

.mobile-nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 1rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
}

.mobile-nav-btn {
    padding: 0.5rem;
    min-width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bs-btn-border-radius);

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    i {
        font-size: 1rem;
    }
}

.mobile-page-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    margin: 0 1rem;
}

.current-page-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    font-weight: 500;
    color: var(--bs-btn-active-bg);

    .page-number {
        font-size: 1.5rem;
        font-weight: 600;
    }

    .page-separator {
        font-size: 1rem;
        color: #6c757d;
    }

    .total-pages {
        font-size: 1rem;
        color: #6c757d;
    }
}

.page-dots {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.page-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--bs-btn-border-color);
    transition: all 0.2s ease;

    &.active {
        background: var(--bs-btn-active-bg);
        transform: scale(1.5);
    }
}

@media (max-width: 768px) {
    .desktop-view {
        display: none;
    }

    .mobile-view {
        display: block;
    }

    .pagination-controls {
        padding: 0.75rem 0.5rem;
    }
}

@media (max-width: 480px) {
    .mobile-nav-container {
        max-width: 280px;
        padding: 0.5rem 0.75rem;
    }

    .current-page-display .page-number {
        font-size: 1.375rem;
    }
}

@media (max-width: 360px) {
    .mobile-nav-container {
        max-width: 240px;
        padding: 0.375rem 0.5rem;
    }

    .current-page-display .page-number {
        font-size: 1.25rem;
    }
}
</style>
