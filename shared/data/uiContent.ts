/** Stable i18n keys for sidebar menu (use with t(`sidebar.${key}`)). */
export const sidebarMenuKeys = [
  "exchanges",
  "wallets",
  "newWallets",
  "top10Wallets",
  "blacklistedWallets",
  "hardware",
  "casinos",
  "games",
  "nft",
] as const;
export const sidebarMenuItems = ["Exchanges", "Wallets", "New Wallets", "Top 10 Wallets", "Blacklisted Wallets", "Hardware", "Casinos", "Games", "NFT"];
export const languageItems = ["English"];
/** Stable i18n keys for help menu (use with t(`sidebar.${key}`)). No hardcoded counts. */
export const helpMenuKeys = ["readMessages", "editProfile", "changePassword", "fileComplaint", "writeSupportTicket"] as const;
export const helpMenuItems = ["Read Messages", "Edit Profile", "Change Password", "File a complaint", "Write a support ticket"];

export const alerts = [
  {
    type: "trending",
    title: "Trending now:",
    content: "Best Hardware Wallets 2026",
    bgColor: "bg-primary",
    textColor: "text-white",
    height: "h-14",
    padding: "px-3 mt-16 py-2",
    hasScore: false,
  },
  {
    type: "scam",
    title: "Latest Scam Alert:",
    content: "Awax Wallet",
    score: "2.5/10",
    reports: "127 reports in 24hrs",
    bgColor: "bg-alert-red",
    textColor: "text-white",
    height: "auto",
    padding: "px-3 py-2 pb-3",
    hasScore: true,
  },
];

export const companyProfile = {
  name: "H1 Companyprofile",
  score: "9.5/10",
  reviews: "130",
  companies: "13",
  description: "Real crypto review community where everyone can warning. Compare exchanges, read reviews and share your experience.",
  notification: "Notification line: Green for success and red for fake or warning",
};
