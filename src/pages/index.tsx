import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar, FiUser } from "react-icons/fi";
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}



export default function Home(props: HomeProps) {
  const postsPagination = props.postsPagination
  const [posts, setPosts] = useState([]);
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    setPosts(postsPagination.results)
    setNextPage(postsPagination.next_page)
  }, [])

  function handlePosts() {
    fetch(nextPage)
      .then(response => response.json())
      .then((data) => {
        const formattedPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              "dd LLL yyyy",
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author
            }
          }
        })
        setNextPage(data.next_page);
        setPosts([...posts, ...formattedPosts]);
      })
  }


  return (
    <>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          {posts.map(post => (
            <a href={('/post/'+ post.uid)} key={post.uid} >
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
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
              </div>

            </a>
          ))}
          <button type="button" onClick={handlePosts} hidden={nextPage === null}
          >
            Carregar mais posts
          </button>
        </div>

      </main>
    </>
  )
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['document.title', 'document.subtitle', 'document.author'],
    pageSize: 3,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page
      }
    }
  }
};
