import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { didUserLikeComment, type Comment } from '../../interface_data/index.ts';
import { getCommentsMock } from '../../api_data/client.ts';
import { FaHeart, FaShareSquare } from 'react-icons/fa';
import styles from './Threads.module.scss';
import { useInitialDataLoad, useFetchCommentForest, useThread } from '../../global_state/cache_hooks.ts';
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { useToggleLike } from '../../global_state/comment_hooks.ts';

export default function Threads() {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];

  const { commentId } = useParams<{ commentId: string }>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleLike = useToggleLike();
  const fetchCommentTree = useFetchCommentForest();
  const parentComment = useThread(commentId!);
  const [loading, setLoading] = useState(true);
  // Fetch comment tree for comment on page load
  useEffect(() => {
    setLoading(true);
    fetchCommentTree(commentId!).then(() => setLoading(false));
  }, [commentId]);

  if (loading) {
    return <div>Loading. . . </div>;
  }
  if (!parentComment) {
    return <p>I am Sorry But no comments found.</p>;
  }

  const togExp = (id: string) => {
    setExpanded((pre) => ({ ...pre, [id]: !pre[id] }));
  };

  function renCommTree(comment: Comment, level = 1, parentUsername: string)
  {
    const displayHeader = level >= 2 && parentUsername ? (
        <Link to={`/Profile/${parentUsername}`} className={styles.usernameLink}>
          @{parentUsername}
        </Link>
      ) : null;

    //Need this so I can customize each of the classes separately not as one div.
    // But also made it so all the comments after the 2nd level will have the same way of looking
    let depClasses = '';
    if (level === 1)
      {depClasses = styles.chComm;}
    else if (level >= 2)
      {depClasses = styles.nestedComm;}

    const contClasses = `${styles.commCard} ${depClasses}`;

    return (
      <div key={comment.id} className={contClasses}>
        <div className={styles.threadHeader}>{comment.username}</div>
        <div className={styles.descripModel}>
          <p>
            {displayHeader ? (
              <div className={styles.commBody}>
                {displayHeader} {comment.body}
              </div>
            ) : (
              comment.body
            )}
          </p>
        </div>

        {comment.images?.length > 0 && (
          <div className={styles.commimgs}>
            {comment.images.map((img, num) => (
              <img key={num} src={img} alt={`comment Image ${num + 1}`} />
            ))}
          </div>
        )}

        <div className={styles.commFoot}>
          <span
            className={`${styles.likeIcon} ${
              didUserLikeComment(userAuthState, comment.id) ? styles.liked : ''
            }`}
            onClick={() => toggleLike(parentComment!.id, comment.id)}
            role="button"
            aria-label="Like Comment"
          >
            <FaHeart />
            <p className={styles.likeCount}>
              {comment.likes}
            </p>
          </span>
          <span
            className={styles.shareIcon}
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/threads/${comment.id}`
              );
              alert('Post URL copied!');
            }}
            aria-label="Share Comment"
          >
            <FaShareSquare />
          </span>
        </div>

        {comment.replies?.length > 0 && (
          <div className={styles.showMore}>
            <button onClick={() => togExp(comment.id)} aria-label="Nested Replies">
              {/*I will change the Icons after this is from google for now */}
              {expanded[comment.id] ? '▼' : '►'}
              {expanded[comment.id]
                ? ` Hide replies (${comment.replies.length})`
                : ` Show replies (${comment.replies.length})`}
            </button>
          </div>
        )}

        {expanded[comment.id] &&
          comment.replies?.map((child) =>
            renCommTree(child, level + 1, comment.username)
          )}
      </div>
    );
  }

  //I need to fast check before anything else to see if the it is null or not
  //IDK if this is a good way yet?
  if (!parentComment) {
    return <p>Sorry, No Comment found.</p>;
  }

  return (
    <div className={styles.threads}>
      <div className={ `${styles.commCard} ${styles.pComm}`}>
        <div className={styles.threadHeader}>
          <strong>{parentComment.username}</strong>
        </div>

        <div className={styles.descripModel}>
          <p>{parentComment.body}</p>
        </div>

        {parentComment.images?.length > 0 && (
          <div className={styles.commimgs}>
            {parentComment.images.map((img, num) => (<img key={num} src={img} alt={`Post Image ${num + 1}`} />))}
          </div>
        )}
        <div className={styles.commFoot}>
          <span className={ `${styles.likeIcon} ${ didUserLikeComment(userAuthState, parentComment.id) ? styles.liked : ''}`}
            onClick={() => toggleLike(parentComment.id, parentComment.id)}
            role="button"
            aria-label="Like Comment"
          >
            <FaHeart />
            <p className={styles.likeCount}>
              {parentComment.likes}
            </p>
          </span>
          <span
            className={styles.shareIcon}
            onClick={() => {
              navigator.clipboard.writeText( `${window.location.origin}/Threads/${parentComment.id}`);
              alert('Post URL copied!');
            }}
            aria-label="Reply Share Comment"
          >
            <FaShareSquare />
          </span>
        </div>
      </div>

      <div className={styles.threadCon}>
        {parentComment.replies?.map((reply) => renCommTree(reply, 1, parentComment.username))}
      </div>
    </div>
  );
}
