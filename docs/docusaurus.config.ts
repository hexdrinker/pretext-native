import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'pretext-native',
  tagline: 'Measure text height and line breaks before rendering in React Native',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://hexdrinker.github.io',
  baseUrl: '/pretext-native/',

  organizationName: 'hexdrinker',
  projectName: 'pretext-native',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    localeConfigs: {
      en: { label: 'English' },
      ko: { label: '한국어' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/hexdrinker/pretext-native/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'pretext-native',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/changelog',
          label: 'Changelog',
          position: 'left',
        },
        {
          href: 'https://github.com/hexdrinker/pretext-native',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/pretext-native',
          label: 'npm',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'API Reference',
              to: '/docs/api',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Changelog',
              to: '/changelog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/hexdrinker/pretext-native',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/pretext-native',
            },
          ],
        },
      ],
      copyright: `Copyright \u00a9 ${new Date().getFullYear()} hexdrinker. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'kotlin', 'swift'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
