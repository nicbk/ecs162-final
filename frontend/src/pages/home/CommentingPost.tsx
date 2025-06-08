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

export function CommentingPost({
  // onSubmit,
  onCancel, activeRest, comments, toggleLike, text, setText, didUserLikeResource, handlePostComment,
}: {
  // onSubmit: (text: string) => void,
  onCancel: () => void
  activeRest: Restaurant;
  comments: Comment[];
  toggleLike: (restaurantId: string, resourceId: string) => void;
  text: string;
  setText: (s: string) => void;
  didUserLikeResource: (resourceId: string) => boolean;
  handlePostComment: (restaurantId: string, parentId: string) => void;
}) {
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
                      didUserLikeResource(comm.id) ? styles.liked : ''
                    }`}
                    onClick={() => toggleLike(activeRest.restaurantId, comm.id)}
                    role="button"
                    aria-label="Like Comment"
                  >
                    <FaHeart />
                  </span>

                  <span
                    className={styles.commentIcon}
                    onClick={() => {/* not yet started on it*/}}
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