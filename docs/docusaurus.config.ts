import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import dotenv from "dotenv"
dotenv.config()
const config: Config = {
  title: "AFK Aligned Fam Kernel",
  tagline:
    "Social payment network to exchange money, data, and thoughts.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://docs.afk-community.xyz",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "AFK-AlignedFamK", // Usually your GitHub org/user name.
  projectName: "afk_monorepo", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  //   defaultLocale: "en",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        googleAnalytics: {
          trackingID: process.env.NEXT_PUBLIC_GTAG_TRACKING_ID ?? "",
          anonymizeIP: true,
        },
        docs: {
          // id: 'docs',
          routeBasePath: 'docs',
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/AFK-AlignedFamKernel/afk_monorepo/blob/main/docs/",
        },
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     "https://github.com/AFK-AlignedFamKernel/afk_monorepo/blob/main/docs/",
        // },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/afkMascot.png",
    navbar: {
      title: "AFK",
      logo: {
        alt: "AFK Logo",
        src: "img/afkMascot.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://afk-community.xyz",
          label: "App",
          position: "right",
        },
        {
          href: "https://github.com/AFK-AlignedFamKernel/afk_monorepo",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Documentation",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Telegram",
              href: "https://t.me/afk_aligned_fam_kernel",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/AFK_AlignedFamK",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/AFK-AlignedFamK",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AFK Aligned Fam Kernel. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
