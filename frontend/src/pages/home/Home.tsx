import styles from './Home.module.scss';
import { type Restaurant } from '../../interface_data/index.ts';
import { type Comment } from '../../interface_data/index.ts';
import mapIcon from '../../assets/map-icon.svg';
import {FaHeart, FaRegComment, FaShareSquare} from "react-icons/fa";
import { useState, useEffect } from 'react';
import { getRestaurants, getComments } from '../../api_data/client.ts';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [activeRest, setActiveRest] = useState<Restaurant | null>(null)
  const [popupType, setpopupType] = useState<'comment' | 'share' | null>(null)
  const [text, setText] = useState('')
  const [likedCom, setlikedCom] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadTheData = async () => {
      try {
        const [restaurantsData, commentsData] = await Promise.all([getRestaurants(), getComments()])
        setRestaurants(restaurantsData)
        console.log('got restaurants:', restaurantsData)
        setComments(commentsData)
        console.log('got comments:', commentsData)

      } catch (error) {
        console.error('Failed to load data', error)
      }
    }
    loadTheData()}, []
  )

  const toggleLike = (id: string) =>
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleLikeCom = (id: string) => {
    setlikedCom((prev) => ({ ...prev, [id]: !prev[id] }));
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
    ? comments.filter((comm) => comm.parent_id === activeRest.restaurantId)
    : [];

  const handlePostComment = () => {
    if (!activeRest || !text.trim()) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      username: 'me ayub for now',
      body: text.trim(),
      images: [],
      likes: 3,
      deleted: false,
      replies: [],
      parent_id: activeRest.restaurantId,
    }
    setComments((prev) => [newComment, ...prev]);
    setText('');
  }

  return (
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
              <img src={rest.images[0]}
               alt="Card Image" />
            </div>
            <div className={styles.cardFooter}>
                <span
                className={`${styles.likeIcon} ${liked[rest.restaurantId] ? styles.liked : ''}`}
                onClick={() => toggleLike(rest.restaurantId)}
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
                likedCom={likedCom}
                toggleLikeCom={toggleLikeCom}
                text={text}
                setText={setText}
                handlePostComment={handlePostComment}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CommentingPost({
  // onSubmit,
  onCancel, activeRest, comments, likedCom, toggleLikeCom, text, setText, handlePostComment,
}: {
  // onSubmit: (text: string) => void,
  onCancel: () => void
  activeRest: Restaurant;
  comments: Comment[];
  likedCom: Record<string, boolean>;
  toggleLikeCom: (id: string) => void;
  text: string;
  setText: (s: string) => void;
  handlePostComment: () => void;
}) {
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
                      likedCom[comm.id] ? styles.liked : ''
                    }`}
                    onClick={() => toggleLikeCom(comm.id)}
                    role="button"
                    aria-label="Like Comment"
                  >
                    <FaHeart />
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
                      const Url = `${window.location.origin}/some kind of connection with threads/${comm.id}`;
                      navigator.clipboard.writeText(Url);
                      alert('copied!');
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
              onClick={handlePostComment}
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