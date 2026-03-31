import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          pretext<span className={styles.accent}>-native</span>
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/api">
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    title: 'Pre-render Measurement',
    description:
      'Know the exact height and line count of any text before it renders. No more layout jumps, no hidden render passes.',
  },
  {
    title: 'Native Precision',
    description:
      'Uses CoreText on iOS and StaticLayout on Android — the same engines React Native uses internally.',
  },
  {
    title: 'Blazing Fast Cache',
    description:
      'Two-tier LRU cache achieves 95%+ hit rate. Warm cache runs at 2\u20135M ops/s.',
  },
];

function Feature({title, description}: {title: string; description: string}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout description="Measure text height and line breaks before rendering in React Native">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
        <section className={styles.codeExample}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>Quick Example</Heading>
            <pre className={styles.codeBlock}>
              <code>{`import { useTextLayout } from 'pretext-native';

const { height, lineCount, isTruncated } = useTextLayout({
  text,
  width: 320,
  fontSize: 15,
  lineHeight: 22,
  maxLines: 3,
});`}</code>
            </pre>
          </div>
        </section>
      </main>
    </Layout>
  );
}
