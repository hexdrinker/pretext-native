import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'getting-started',
    'how-it-works',
    'benchmarks',
    {
      type: 'category',
      label: 'API Reference',
      items: ['api', 'api-core'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/flatlist', 'guides/chat', 'guides/truncation'],
    },
    'limitations',
    'contributing',
  ],
};

export default sidebars;
