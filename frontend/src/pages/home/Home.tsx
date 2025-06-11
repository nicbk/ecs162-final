import styles from './Home.module.scss';
import { didUserLikeComment, didUserWishRestaurant, type InputComment, type Restaurant} from '../../interface_data/index.ts';
import { type Comment } from '../../interface_data/index.ts';
import mapIcon from '../../assets/map-icon.svg';
import {FaHeart, FaRegComment, FaShareSquare, FaRegBookmark, FaBookmark, FaStar, FaStarHalfAlt, FaRegStar} from "react-icons/fa";
import { postComment, removeLike, addLike, RESTAURANTS_FETCH_LIMIT } from '../../api_data/client.ts';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext, useCallback } from 'react';
import { GlobalStateContext, type UserAuthState } from '../../global_state/global_state.ts';
import { useParams } from 'react-router-dom'
import { ThrottledImage } from '../../components/ThrottledImage/ThrottledImage.tsx';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
import { useComments, useFetchCommentForest, useRestaurants, useUpdateRestaurants } from '../../global_state/cache_hooks.ts';
import { getRestaurants } from '../../api_data/client.ts';
import { useToggleLike } from '../../global_state/comment_hooks.ts';
import { useToggleWish } from '../../global_state/wishlist_hooks.ts';
import { CommImgUpload } from '../../components/ImgUploader/CommImgUpload.tsx';
import { useDebounce, useRestaurantLazyLoad } from '../../global_state/restaurant_hooks.ts';
import { RateSlide } from '../../components/Slider/RateSlide.tsx';

const DEBOUNCER_DELAY = 2500; // in milliseconds

function StarRating({ ratingofRest }: { ratingofRest: number }) {
  const roundRating = Math.round(ratingofRest * 2) / 2;
  const fStarRating = Math.floor(roundRating);

  const HalfStarRating = roundRating - fStarRating === 0.5;
  const emptyCount = 5 - fStarRating - (HalfStarRating ? 1 : 0);
  
  const stars = [];
  for (let i = 0; i < fStarRating; i++) {
    stars.push(<FaStar className={styles.starFilled} />);
  }
  if (HalfStarRating) {
    stars.push(<FaStarHalfAlt className={styles.halfStar} />);
  }
  for (let i = 0; i < emptyCount; i++) {
    stars.push(<FaRegStar className={styles.emptyStar} />);
  }
  return <div className={styles.stars}>{stars}</div>; 
}

export default function Home() {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];
  const userLocation = globalState!.userLocationState[0];
  const [resetUploader, setResetUploader] = useState(0);

  const refetchCommentForest = useFetchCommentForest();
  const toggleLike = useToggleLike();
  const toggleWish = useToggleWish();
  const [restaurants, setRestaurants] = useRestaurants();
  const updateRestaurants = useUpdateRestaurants();
  const comments = useComments()[0];
  const [activeRest, setActiveRest] = useState<Restaurant | null>(null)
  const [popupType, setpopupType] = useState<'comment' | 'share' | null>(null)
  const [text, setText] = useState('')
  const { restaurantId: copyId } = useParams<{ restaurantId?: string }>();
  const [isEndOfLoad, fetchNextRestaurants] = useRestaurantLazyLoad(RESTAURANTS_FETCH_LIMIT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollDebouncer = useDebounce(DEBOUNCER_DELAY);

  // We need to come up with a way of sharing the restaurant.
  const giveShare = () => {
    if (!activeRest) return;
    const shareUrl = `${activeRest.address}`;
    navigator.clipboard.writeText(shareUrl);
    closeModal()
  };

  useEffect(() => {
    if (!copyId) return;
    const element = document.getElementById(copyId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [copyId, restaurants]);

  useEffect(() => {
    const PAGE_BOTTOM_TRIGGER_OFFSET = 300; // units in CSS pixels
    // Here we borrow code from Nicolas and Andrew's HW3 for lazyloading when the mouse scroll reaches near the bottom of the body height
    // console.log('here1')
    // console.log(isLoading)
    // console.log(isEndOfLoad)
    // console.log('here2')
    const onScrollBottom = async () => {
      if (userLocation && !isLoading && !isEndOfLoad && window.innerHeight + window.scrollY >= document.body.scrollHeight - PAGE_BOTTOM_TRIGGER_OFFSET) {
        console.log('triggered')
        scrollDebouncer(async () => {
          setIsLoading(true);
          await fetchNextRestaurants();
          setIsLoading(false);
        });
      }
    };

    window.addEventListener('scroll', onScrollBottom);
    return () => window.removeEventListener('scroll', onScrollBottom);
  }, [fetchNextRestaurants, isLoading, isEndOfLoad, userLocation]);

  const firstLayerForActive = activeRest
    ? comments.filter((comm: Comment) => comm.parentId === activeRest.restaurantId)
    : [];

  const handlePostComment = (restaurantId: string, parentId: string, images: string[], rating: number) => {
    if (!activeRest || (!text.trim() && images.length === 0)) return;

    const newComment: InputComment = {
      body: text.trim(),
      rating,
      images,
    };

    postComment(newComment, parentId)
      .then(() =>{ refetchCommentForest(restaurantId);

    setText('');
      setResetUploader(comm => comm + 1);
    });
  }

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

  if (!restaurants.length) return <LoadingSpinner />;

  return (
    <div className={styles.homeLoadingContainer}>
      <div className={styles.home}>
        {restaurants.map(rest => (
          <div id={rest.restaurantId} className={styles.card} key={rest.restaurantId}>
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
                <StarRating ratingofRest={rest.rating} />
              </div>
              <div className={styles.cardImage}>
                <ThrottledImage
                  src={rest.images[0]}
                  alt="Card Image"
                />
              </div>
              <div className={styles.cardFooter}>
                <span
                  className={`${styles.wishIcon} ${didUserWishRestaurant(userAuthState, rest.restaurantId) ? styles.wishedIcon : ''}`}
                  onClick={() => toggleWish(rest.restaurantId)}
                  role="button"
                  aria-label={didUserWishRestaurant(userAuthState, rest.restaurantId) ? "Remove wishlist" : "Add wishlist"}
                >
                  {didUserWishRestaurant(userAuthState, rest.restaurantId) ? <FaBookmark /> : <FaRegBookmark />}
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
        {/*loadMorePost && <div className={styles.loadMorePost}>Loading more...</div>*/}
        {isLoading && <LoadingSpinner />}
        {isEndOfLoad && <p>No more restaurants have been found in your nearest area! Walk around to find some more.</p>}

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
                    <p>Either copy and paste this to a new link or click the copy button to copy it to your clipboard:</p>
                    <input className={styles.shareInput}
                      readOnly
                      value={`${activeRest.address}`}
                      onFocus={(event) => event.target.select()}
                    />
                    <div className={styles.popupBoxFooter}>
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
                  didUserLikeComment={didUserLikeComment}
                  handlePostComment={handlePostComment}
                  resetCounter={resetUploader}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentingPost({
  onCancel, activeRest, comments, toggleLike, text, setText, didUserLikeComment, handlePostComment, resetCounter,
}: {
  resetCounter: number
  onCancel: () => void
  activeRest: Restaurant;
  comments: Comment[];
  toggleLike: (restaurantId: string, commentId: string) => void;
  text: string;
  setText: (s: string) => void;
  didUserLikeComment: (user: UserAuthState, commentId: string) => boolean;
  handlePostComment: (restaurantId: string, parentId: string, images: string[], rating: number) => void;
}) {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  return (
      <div className={styles.popupModelBody}>
        <div className={styles.commentListCon}>
          {comments.length === 0 ? (
            <p className={styles.solo}>No comments yet.</p>
          ) : (
            comments.map((comm) => (

              <div key={comm.id} className={styles.commentCard}>

                <div className={styles.commentHeader}>
                  <strong>{comm.username}</strong>
                  {comm.rating !== undefined && (<div className={styles.commentRating}> <p>{comm.rating}</p></div>)}
                </div>

                <div className={styles.description}>
                  <p>{comm.body}</p>
                </div>
                
                    {comm.images && comm.images.length > 0 && (
                      <div className={styles.commentimgs}>
                        {comm.images.map((img, index) => (
                          <img key={index} src={img} alt={`Comment Image ${index + 1}`} />
                        ))}
                      </div>
                  )}
                <div className={styles.commentFoot}>
                  <span
                    className={`${styles.likeIcon} ${
                      didUserLikeComment(userAuthState, comm.id) ? styles.liked : ''
                    }`}
                    onClick={() => toggleLike(activeRest.restaurantId, comm.id)}
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
                      const Url = `${window.location.origin}/threads/${comm.id}`;
                      navigator.clipboard.writeText(Url);
                      alert('Comment URL copied!');
                    }}
                    role="button"
                    aria-label="Share Comment"
                  >
                    <FaShareSquare />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.popupBoxBody}>
          <h3>Comments for {activeRest.restaurantTitle}</h3>
          <CommImgUpload onChange={setImages} resetCounter={resetCounter}/>
          <RateSlide value={rating} slideChange={val => setRating(val)} />
            {submitAttempted && rating === null && (<p className={styles.sliderError}> Please pick a rating for this restaurant.</p>)}
          <textarea
            className={styles.textarea}
            placeholder="Write a Comment. . . ."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className={styles.popupBoxFooter}>
            <p className={styles.limited}>You can upload up to 3 max images.</p>
            <button
              onClick={() => {
                setSubmitAttempted(true);
                if (rating === null) return;
                handlePostComment(activeRest.restaurantId, activeRest.restaurantId, images,rating);
              }}
              disabled={!text.trim() && images.length === 0}
            >
              Post!
            </button>
            <button onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
  )
}