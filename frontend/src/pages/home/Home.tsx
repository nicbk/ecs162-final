import styles from './Home.module.scss';
import { mockResturantsData } from '../../api_data/mock_data';
import { type Restaurant } from '../../interface_data/index.ts';
import { mockPublish } from '../../api_data/mock_data';
import { type Comment } from '../../interface_data/index.ts';
import mapIcon from '../../assets/map-icon.svg';
import {FaHeart, FaRegComment, FaShareSquare} from "react-icons/fa";
import { useState, useEffect } from 'react';
import { getRestaurants, getComments } from '../../api_data/client.ts';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [activeRest, setActiveRest] = useState<Restaurant | null>(null)
  const [popupType, setpopupType] = useState<'comment' | 'share' | null>(null)

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

  const openModal = (rest: Restaurant, type: 'comment' | 'share') => {
    setActiveRest(rest)
    setpopupType(type)
  }
  const closeModal = () => {
    setActiveRest(null)
    setpopupType(null)
  }

  const subComment = (text: string) => {
    console.log('POST /api/v1/comment', {
      restaurantId: activeRest?.restaurantId,
      body: text,
    })
    closeModal()
  }
  // We need to come up with a way of sharing the restaurant.
  const giveShare = () => {
    console.log('POST /api/v1/haven"t yet decided', {
      restaurantId: activeRest?.restaurantId,
    })
    closeModal()
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
                onClick={() => openModal(rest, 'comment')}
                role="button"
                aria-label="Comment"
              >
                <FaRegComment />
              </span>

              <span
                className={styles.shareIcon}
                onClick={() => openModal(rest, 'share')}
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
            <h3>
              {popupType === 'comment'
                ? `Comment on ${activeRest.restaurantTitle}`
                : `Share ${activeRest.restaurantTitle}`}
            </h3>
            {popupType === 'comment' ? (<CommentingPost onSubmit={subComment} onCancel={closeModal} />
            ) : (
              <SharingURL restaurant={activeRest} onShare={giveShare} onCancel={closeModal} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CommentingPost({
  onSubmit, onCancel
}: {
  onSubmit: (text: string) => void, onCancel: () => void
}) {
  const [text, setText] = useState('')
  return (
    <div className={styles.popupBoxBody}>
      <textarea
        className={styles.textarea}
        placeholder="Write a Comment. . . ."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className={styles.popupBoxFooter}>
        <button
          onClick={() => onSubmit(text)}
          disabled={!text}
        >
          Post!
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function SharingURL({
  restaurant, onShare,onCancel
}: {
  restaurant: Restaurant, onShare: () => void, onCancel: () => void
}) {
  return (
    <div className={styles.popupBoxBody}>
      <p>place holder but maybe we can put:</p>
      <a href="https://g.co/kgs/ASVooP7" >{restaurant.restaurantTitle}</a>
      <div className={styles.popupBoxFooter}>
        {/* I will add something to copy later, for now it is jhust here for placeholde */}
        <button onClick={onShare}>Copy!</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}