import { useState, useEffect } from 'react';
import { type Restaurant, type Comment } from '../../interface_data/index.ts';
import { getRestaurantsMock, getCommentsMock } from '../../api_data/client.ts';
import { FaHeart, FaShareSquare } from 'react-icons/fa';
import styles from './SocialMedia.module.scss';

export default function SocialMedia() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [comments, setComm] = useState<Comment[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadTheData = async () => {
      try {
      const [restaurantsData, commentsData] = await Promise.all([ getRestaurantsMock(), getCommentsMock()]);
      setRestaurants(restaurantsData)
      console.log('got restaurants:', restaurantsData)
      setComm(commentsData)
      console.log('got comments:', commentsData)
      } catch (error) {
        console.error('Failed to load data', error)
      }
    };
    loadTheData()}, []
  );

  //I am right now just getting the info using the restaurantId and restaurantTitle
  //But well have to change it later maybe for the nearby info available
  const resturantTitleId = restaurants.reduce<Record<string,string>>((account, restaurants) => {
    account[restaurants.restaurantId] = restaurants.restaurantTitle;
    return account;
  }, {});

  const firstLayerForActive = comments.filter(comm => comm.parent_id != null && resturantTitleId[comm.parent_id] != null);
  const togLike = (id: string) => setLiked(pre => ({ ...pre, [id]: !pre[id] }));

  return (
    <div className={styles.socialM}>
      <div className={styles.socialSection}>
        {firstLayerForActive.map(comm => (
          <div key={comm.id} className={styles.socialCard}>

            <div className={styles.socialHeader}>
              {'By ' + comm.username + ' For '}
              <span className={styles.restName}>
                {comm.parent_id && resturantTitleId[comm.parent_id]}
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
                className={`${styles.likeIcon} ${liked[comm.id] ? styles.liked : ''}`}
                onClick={() => togLike(comm.id)}
                role="button"
                aria-label="Like Comment"
              >
                <FaHeart />
                <p className={styles.likeCount}>
                  {liked[comm.id] ? comm.likes + 1 : comm.likes}
                </p>
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
