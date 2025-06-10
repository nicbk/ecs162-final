import { useState, useEffect, useContext } from 'react';
import { FaHeart, FaShareSquare,FaRegComment } from 'react-icons/fa';
import styles from './SocialMedia.module.scss';
import { useNavigate } from 'react-router-dom';
import { useComments, useFirstLevelComments, useInitialDataLoad, useRestaurants } from '../../global_state/cache_hooks.ts';
import { didUserLikeComment, type User } from '../../interface_data/index.ts';
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { useToggleLike } from '../../global_state/comment_hooks.ts';

export default function SocialMedia() {
  //const restaurants = useRestaurants()[0];
  //const comments = useComments()[0];
  const userAuthState = useContext(GlobalStateContext)!.userAuthState[0];
  const firstLayerComments = useFirstLevelComments();
  const toggleLike = useToggleLike();
  //I am right now just getting the info using the restaurantId and restaurantTitle
  //But well have to change it later maybe for the nearby info available
  /*
  const resturantTitleId = restaurants.reduce<Record<string,string>>((account, restaurants) => {
    account[restaurants.restaurantId] = restaurants.restaurantTitle;
    return account;
  }, {});
  */

  //const firstLayerForActive = comments.filter(comm => comm.parentId != null && resturantTitleId[comm.parentId] != null);
  //const togLike = (id: string) => setLiked(pre => ({ ...pre, [id]: !pre[id] }));
  const navigate = useNavigate();

  if (firstLayerComments.length === 0) {
    return <p>(Either the page is loading or no posts have been made yet. To make this logic more robust, first implement the restaurant retrieval logic in the useFirstLevelComments() hook)</p>
    //return <p>No posts have been made yet! You can try going to the Home page and commenting on a restaurant.</p>
  }

  return (
    <div className={styles.socialM}>
      <div className={styles.socialSection}>
        {firstLayerComments.map(({ comment: comm, restaurant }) => (
          <div key={comm.id} className={styles.socialCard}>

            <div className={styles.socialHeader}>
              {'By ' + comm.username + ' For '}
              <span className={styles.restName}>
                {restaurant.restaurantTitle}
              </span>
            </div>

            <div className={styles.socialBody}>
              <p>{comm.body}</p>
            </div>

            {comm.images?.length > 0 && (
              <div className={styles.images}>
                {comm.images.map((img, index) => ( <img key={index} src={img} alt={`Comment ${index}`} />))}
              </div>
            )}

            <div className={styles.footer}>
              <span
                className={`${styles.likeIcon} ${didUserLikeComment(userAuthState, comm.id) ? styles.liked : ''}`}
                onClick={() => toggleLike(restaurant.restaurantId, comm.id)}
                role="button"
                aria-label="Like Comment"
              >
                <FaHeart />
                <p className={styles.likeCount}>
                  {comm.likes}
                </p>
              </span>

              <span
                className={styles.commentIcon}
                onClick={() => {navigate(`/Threads/${comm.id}`)}}
                role="button"
                aria-label="will be threads"
              >
                <FaRegComment />
              </span>

              <span
                className={styles.shareIcon}
                onClick={() => {
                  navigator.clipboard.writeText( `${window.location.origin}/threads/${comm.id}`);
                  alert('Comment URL copied!');
                }}
                aria-label= "Share Comment"
              >
                <FaShareSquare />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
