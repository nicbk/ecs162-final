import styles from './Home.module.scss';
import { didUserLikeComment, isUser, type InputComment, type Restaurant, type User } from '../../interface_data/index.ts';
import { type Comment } from '../../interface_data/index.ts';
import mapIcon from '../../assets/map-icon.svg';
import {FaHeart, FaRegComment, FaShareSquare} from "react-icons/fa";
import { postComment, removeLike, addLike  } from '../../api_data/client.ts';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { GlobalStateContext, type UserAuthState } from '../../global_state/global_state.ts';
import { useParams } from 'react-router-dom'
import { ThrottledImage } from '../../components/ThrottledImage/ThrottledImage.tsx';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
import { useComments, useFetchCommentForest, useRestaurants } from '../../global_state/cache_hooks.ts';
import { useInitialDataLoad } from '../../global_state/cache_hooks.ts';
import { useToggleLike } from '../../global_state/comment_hooks.ts';

export default function Home() {
  useInitialDataLoad();

  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];

  const refetchCommentForest = useFetchCommentForest();
  const toggleLike = useToggleLike();
  const restaurants = useRestaurants()[0];
  const comments = useComments()[0];
  const [activeRest, setActiveRest] = useState<Restaurant | null>(null)
  const [popupType, setpopupType] = useState<'comment' | 'share' | null>(null)
  const [text, setText] = useState('')
  const { restaurantId: copyId } = useParams<{ restaurantId?: string }>();

  // We need to come up with a way of sharing the restaurant.
  const giveShare = () => {
    if (!activeRest) return;
    const shareUrl = `${activeRest.address}`;
    navigator.clipboard.writeText(shareUrl);
    closeModal()
  };

  const firstLayerForActive = activeRest
    ? comments.filter((comm: Comment) => comm.parentId === activeRest.restaurantId)
    : [];

  const handlePostComment = (restaurantId: string, parentId: string) => {
    if (!activeRest || !text.trim()) return;

    const newComment: InputComment = {
      body: text.trim(),
      rating: 5,
      images: [],
    };

    postComment(newComment, parentId)
      .then(() => refetchCommentForest(restaurantId));

    setText('');
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

  useEffect(() => {
    if (!copyId) return;
      const start_element = document.getElementById(copyId);
      if (start_element) {
        start_element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    return;
  }, [copyId, restaurants]);

  const mainRestaurants = (
    <>
      {restaurants.map((rest: Restaurant) => (
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
                  className={`${styles.likeIcon} ${didUserLikeComment(userAuthState, rest.restaurantId) ? styles.liked : ''}`}
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
              />
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    restaurants.length > 0 &&
      <div className={styles.home}>
        {mainRestaurants}
      </div>
    ||
      <LoadingSpinner />
  );
}

function CommentingPost({
  // onSubmit,
  onCancel, activeRest, comments, toggleLike, text, setText, didUserLikeComment, handlePostComment,
}: {
  // onSubmit: (text: string) => void,
  onCancel: () => void
  activeRest: Restaurant;
  comments: Comment[];
  toggleLike: (restaurantId: string, commentId: string) => void;
  text: string;
  setText: (s: string) => void;
  didUserLikeComment: (user: UserAuthState, commentId: string) => boolean;
  handlePostComment: (restaurantId: string, parentId: string) => void;
}) {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];
  const navigate = useNavigate();

  return (
    <div>
      <div className={styles.popupModelBody}>
        <div className={styles.commentListCon}>
          {comments.length === 0 ? (
            <p className={styles.solo}>No comments yet.</p>
          ) : (
            comments.map((comm) => (

              <div key={comm.id} className={styles.commentCard}>

                <div className={styles.commentHeader}>
                  <strong>{comm.username}</strong>
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
          <textarea
            className={styles.textarea}
            placeholder="Write a Comment. . . ."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className={styles.popupBoxFooter}>
            <button
              onClick={() => handlePostComment(activeRest.restaurantId, activeRest.restaurantId)}
              disabled={!text}
            >
              Post!
            </button>
            <button onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}