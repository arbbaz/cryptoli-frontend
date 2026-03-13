"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useHeaderSearch } from "@/features/header/hooks/useHeaderSearch";

export default function HeaderSearch() {
  const t = useTranslations();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchOpen,
    setSearchOpen,
    searchRef,
    clearSearch,
  } = useHeaderSearch();

  return (
    <div className="relative flex w-full flex-1 justify-center font-space-grotesk sm:w-auto" ref={searchRef}>
      <input
        id="header-search-input"
        type="text"
        placeholder={t("common.search.placeholder")}
        className="header-search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onFocus={() => searchQuery.trim() && setSearchOpen(true)}
        aria-autocomplete="list"
        aria-controls="header-search-results"
      />
      {searchOpen && (
        <div
          id="header-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-[100] max-h-[320px] overflow-y-auto rounded-lg border border-border bg-bg-white py-1 shadow-lg"
        >
          {searchLoading ? (
            <p className="py-4 text-center text-sm text-text-tertiary">
              {t("common.search.loading", { defaultValue: "Searching..." })}
            </p>
          ) : (
            <>
              {searchResults.users.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    {t("common.search.users", { defaultValue: "Users" })}
                  </p>
                  <ul className="mt-0.5">
                    {searchResults.users.map((user) => (
                      <li key={user.id}>
                        <Link
                          href={`/${user.username}`}
                          className="block rounded-md px-2 py-2 text-sm text-text-dark hover:bg-bg-lightest"
                          onClick={clearSearch}
                        >
                          <span className="font-medium">{user.username}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchResults.reviews.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    {t("common.search.reviews", { defaultValue: "Reviews" })}
                  </p>
                  <ul className="mt-0.5">
                    {searchResults.reviews.map((review) => (
                      <li key={review.id}>
                        <Link
                          href={`/?q=${encodeURIComponent(searchQuery.trim())}`}
                          className="block line-clamp-2 rounded-md px-2 py-2 text-sm text-text-dark hover:bg-bg-lightest"
                          onClick={clearSearch}
                        >
                          {review.title}
                          {review.company?.name && (
                            <span className="ml-1 text-xs text-text-secondary">· {review.company.name}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!searchLoading &&
                searchQuery.trim() &&
                searchResults.reviews.length === 0 &&
                searchResults.users.length === 0 && (
                  <p className="py-4 text-center text-sm text-text-tertiary">
                    {t("common.search.noResults", { defaultValue: "No results" })}
                  </p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
