import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client'
import { asText } from '@prismicio/richtext';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div className={styles.fallback}><strong>Carregando...</strong></div>
  }

  const htmlText = post.data.content.map(data => {
    return {
      heading: data.heading,
      body: RichText.asHtml(data.body)
    }
  })
  
  const regex = /\b\s|\.\s|,\s\b/gi
  const readTime = (post.data.content.map(data => { return [...data.heading.split(regex), ...RichText.asText(data.body).split(regex)].length }).reduce((previousValue, currentValue) => previousValue + currentValue) / 150).toFixed() + ' min'


  return (
    <>
      <img className={styles.image} src={post.data.banner.url} alt="banner" />
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <strong>{post.data.title}</strong>
          <div>
            <FiCalendar className={commonStyles.icon} />
            <time>{format(
              new Date(post.first_publication_date),
              "dd LLL yyyy",
              {
                locale: ptBR,
              }
            )}</time>
            <FiUser className={commonStyles.icon} />
            <p>{post.data.author}</p>
            <FiClock className={commonStyles.icon} />
            <p>{readTime}</p>
          </div>
          <div className={styles.text}>
            {htmlText.map(data => {
              return (
                <>
                  <h1>{data.heading}</h1>
                  <div className={styles.content} dangerouslySetInnerHTML={{ __html: data.body }} />
                </>
              )
            })}
          </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['document.title', 'document.subtitle', 'document.author'],
    pageSize: 3,
  });

  return {
    paths: posts.results.map(data => { return { params: { slug: data.uid } } }),
    fallback: true
  }
};

export const getStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(context.params.slug), {});

  const content = response.data.content.map(data => {
    return data;
  }
  )

  const post = {
    post: {
      uid: response.uid,
      first_publication_date: response.first_publication_date,
      data: {
        title: response.data.title,
        subtitle: response.data.subtitle,
        banner: {
          url: response.data.banner.url
        },
        author: response.data.author,
        content: content,
      },
    },
  }

  return {
    props: post
  }

};
