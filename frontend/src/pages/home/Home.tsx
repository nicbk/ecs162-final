import styles from './Home.module.scss';
import { mockResturantsData } from '../../api_data/mock_data';
import { isUser, type InputComment, type Restaurant, type User } from '../../interface_data/index.ts';
import { mockPublish } from '../../api_data/mock_data';
import { type Comment } from '../../interface_data/index.ts';
import mapIcon from '../../assets/map-icon.svg';
import {FaHeart, FaRegComment, FaShareSquare} from "react-icons/fa";
import { useState, useEffect, useContext } from 'react';
import { getRestaurantsMock, getCommentsMock, getRestaurants, getResourceComments, addLike, removeLike, postComment } from '../../api_data/client.ts';
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { getGpsCoords, useGpsSetter } from './helpers.ts';
import { ThrottledImage } from '../../components/ThrottledImage/ThrottledImage.tsx';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
import { CommentingPost } from './CommentingPost.tsx';

const DEFAULT_NUM_RESTAURANTS = 6;

export default function Home() {
  useGpsSetter();

  const globalState = useContext(GlobalStateContext);
  const userLocation = globalState!.userLocationState[0];
  const userAuthState = globalState!.userAuthState[0];

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [commentMap, setCommentMap] = useState<Record<string, Comment[]>>({})
  const [activeRest, setActiveRest] = useState<Restaurant | null>(null)
  const [popupType, setpopupType] = useState<'comment' | 'share' | null>(null)
  const [text, setText] = useState('')

  const comments = Object.values(commentMap).flat();

  const refetchCommentThread = async (restaurantId: string) => {
    const comments = await getResourceComments(restaurantId);
    setCommentMap({
      ...commentMap,
      restaurantId: comments
    });
  };

  const toggleLike = async (restaurantId: string, commentId: string) => {
    if (!isUser(userAuthState)) {
      return;
    }

    if ((userAuthState as User).likedResources.has(commentId)) {
      await removeLike(commentId);
    } else {
      await addLike(commentId);
    }

    await refetchCommentThread(restaurantId);
  }

  const didUserLikeResource = (commentId: string) => {
    if (!isUser(userAuthState)) {
      return false;
    }

    return ((userAuthState as User).likedResources.has(commentId));
  };

  // We need to come up with a way of sharing the restaurant.
  const giveShare = () => {
    console.log('POST /api/v1/haven"t yet decided', {
      restaurantId: activeRest?.restaurantId,
    })
    if (!activeRest) return;
    //If there is a better way I will change it for now lets keep it simple.
    const shareUrl = `${window.location.origin}/Home`;
    console.log('POST /api/v1/haven"t yet decided', {
      restaurantId: activeRest.restaurantId,
      url: shareUrl,
    })
    closeModal()
  }

  const firstLayerForActive = activeRest
    ? comments.filter((comm) => comm.parentId === activeRest.restaurantId)
    : [];

  const handlePostComment = (restaurantId: string, parentId: string) => {
    if (!activeRest || !text.trim()) return;

    const newComment: InputComment = {
      body: text.trim(),
      rating: 5,
      images: [],
    };

    postComment(newComment, parentId)
      .then(() => refetchCommentThread(restaurantId));

    setText('');
  }

  useEffect(() => {
    const loadTheData = async () => {
      if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
        return;
      }

      try {
        const restaurantsData = await getRestaurants(userLocation?.latitude!, userLocation?.longitude!, DEFAULT_NUM_RESTAURANTS);
        const commentsList = await Promise.all(restaurantsData.map(restaurant => getResourceComments(restaurant.restaurantId)));

        const zippedList = restaurantsData.map((restaurant, i) => [restaurant.restaurantId, commentsList[i]] as [string, Comment[]]);
        const commentMap: Record<string, Comment[]> = {};
        for (const pair of zippedList) {
          commentMap[pair[0]] = pair[1];
        }

        setRestaurants(restaurantsData)
        setCommentMap(commentMap);
      } catch (error) {
        console.error('Failed to load data', error)
      }
    };

    loadTheData();
  }, [userLocation]);

  const openModal = (rest: Restaurant) => {
    setActiveRest(rest)
    setpopupType('comment')
    setText('')
  }
  const openShareModal = (rest: Restaurant) => {
    setActiveRest(rest)
    setpopupType('share')
  }
  const closeModal = () => {
    setActiveRest(null)
    setpopupType(null)
  }

  const mainRestaurants = (
    <div className={styles.home}>
      {restaurants.map((rest: Restaurant) => (
        <div className={styles.card} key={rest.restaurantId}>
          <div className={styles.post}>
            <div className={styles.cardHeader}>
              <h2>{rest.restaurantTitle}</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.address}>
                <img
                  src={mapIcon}
                  alt="Map Icon"
                  className={styles.mapIcon}
                />
                <p>{rest.address}</p>
              </div>
              <p>{rest.rating.toPrecision(2)}</p>
            </div>
            <div className={styles.cardImage}>
              <ThrottledImage
              src={rest.images[0]}
              alt="Card Image"
              />
            </div>
            <div className={styles.cardFooter}>
                <span
                className={`${styles.likeIcon} ${didUserLikeResource(rest.restaurantId) ? styles.liked : ''}`}
                onClick={() => toggleLike(rest.restaurantId, rest.restaurantId)}
                role="button"
                aria-label="Like"
                >
                <FaHeart />
                </span>

              <span
                className={styles.commentIcon}
                onClick={() => openModal(rest)}
                role="button"
                aria-label="Comment"
              >
                <FaRegComment />
              </span>

              <span
                className={styles.shareIcon}
                onClick={() => openShareModal(rest)}
                role="button"
                aria-label="Share"
              >
                <FaShareSquare />
              </span>
            </div>
          </div>
        </div>
      ))}

      {activeRest && popupType && (
        <div className={styles.popupOverlay} onClick={closeModal}>
          <div
            className={styles.popupBody}
            onClick={(event) => event.stopPropagation()}
          >
            {popupType === 'share' && (
              <>
                <h3>
                Share {activeRest.restaurantTitle}
                </h3>
                <div className={styles.popupBoxBody}>
                  <p>place holder but maybe we can put:</p>
                  <input
                    readOnly
                    value={`${window.location.origin}/Home`}
                    onFocus={(event) => event.target.select()}
                  />
                  <div className={styles.popupBoxFooter}>
                    {/* I will add something to copy later, for now it is jhust here for placeholde */}
                    <button onClick={giveShare}>Copy!</button>
                    <button onClick={closeModal}>Cancel</button>
                  </div>
                </div>
              </>
            )}

            {popupType === 'comment' && activeRest && (
              <CommentingPost
                // onSubmit ={subComment} 
                onCancel={closeModal}
                activeRest={activeRest}
                comments={firstLayerForActive}
                toggleLike={toggleLike}
                text={text}
                setText={setText}
                didUserLikeResource={didUserLikeResource}
                handlePostComment={handlePostComment}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    restaurants.length > 0 &&
      mainRestaurants
    ||
      <LoadingSpinner />
  )
}
