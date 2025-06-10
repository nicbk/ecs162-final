import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { didUserLikeComment, type Comment, type InputComment } from '../../interface_data/index.ts';
import { postComment } from '../../api_data/client.ts';
import { FaHeart, FaShareSquare, FaRegComment } from 'react-icons/fa';
import styles from './Threads.module.scss';
import { useInitialDataLoad, useFetchCommentForest, useThread, useFetchCommentTree } from '../../global_state/cache_hooks.ts';
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { useToggleLike } from '../../global_state/comment_hooks.ts';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';

const flattenComment = (comment: Comment | null, depth = 0): Comment[] | null => {
  if (!comment) {
    return null;
  }

  let flattenedChildren: Comment[] = [];

  for (const reply of comment.replies) {
    const flattenedReply = flattenComment(reply, depth+1);
    if (flattenedReply) {
      flattenedChildren = flattenedChildren.concat(flattenedReply);
    } else {
      return null;
    }
  }

  if (depth <= 1) {
    const rootWithFlattened = {
      ...comment
    };

    rootWithFlattened.replies = flattenedChildren;

    return [rootWithFlattened];
  }

  const flattenedRoot = {
    ...comment
  };
  flattenedRoot.replies = [];

  const flattenedLayer = [flattenedRoot].concat(flattenedChildren);
  return flattenedLayer;
};

export default function Threads() {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];

  const { commentId } = useParams<{ commentId: string }>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [openChat, onCancel] = useState<Record<string, boolean>>({});
  const [textComm, setReplyText] = useState<Record<string, string>>({});
  const toggleLike = useToggleLike();
  const fetchCommentTree = useFetchCommentTree();
  const parentCommentListNullable = flattenComment(useThread(commentId || null));
  const parentComment = parentCommentListNullable ? parentCommentListNullable[0] : null;
  console.log(parentComment);

  const [loading, setLoading] = useState(true);
  // Fetch comment tree for comment on page load
  useEffect(() => {
    setLoading(true);
    //fetchCommentTree(commentId!).then(() => setLoading(false));
    if (commentId) {
      fetchCommentTree(commentId!);
    }
  }, [commentId]);

  if (loading) {
    if (parentComment) {
      setLoading(false);
    }

    return (
      <LoadingSpinner />
    );
  }

  if (!parentComment) {
    return <p>I am Sorry But no comments found.</p>;
  }

  const handlePostComment = async (parentId: string) => {
    const body = (textComm[parentId] || '').trim();
    if (!body) return;
    const newComment: InputComment = { body, rating: NaN, images: [] };
    await postComment(newComment, parentId);
    await fetchCommentTree(commentId!);
    setReplyText(pre => ({ ...pre, [parentId]: '' }));
    onCancel(pre => ({ ...pre, [parentId]: false }));
  };

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
            className={styles.commentIcon}
            onClick={() =>
              onCancel(pre => ({ ...pre, [comment.id]: !pre[comment.id] }))
            }
            role="button"
            aria-label="Reply to Comment"
          >
            <FaRegComment />
          </span>
          <span
            className={styles.shareIcon}
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/threads/${comment.id}`
              );
              alert('Post URL copied!');
            }}
            role="button"
            aria-label="Share Comment"
          >
            <FaShareSquare />
          </span>
        </div>
        {openChat[comment.id] && (
          <div className={styles.replycomm}>
            <textarea value={textComm[comment.id] || ''}
              onChange={event => setReplyText(pre => ({ ...pre, [comment.id]: event.target.value }))}
              placeholder="Write your reply..."
            />
            <div className={styles.replyButtons}>
              <button onClick={() => handlePostComment(comment.id)}
                disabled={!textComm[comment.id]?.trim()}
              >
                Post Reply
              </button>
              <button onClick={() => onCancel(pre => ({ ...pre, [comment.id]: false }))}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className={styles.showMore}>
            <button onClick={() => togExp(comment.id)} aria-label="Nested Replies">
              {/*I will change the Icons after this is from google for now */}
              {expanded[comment.id] ? '▼' : '►'}{' '}
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
          <div
            className={styles.commentIcon}
            onClick={() => onCancel(pre => ({ ...pre, [parentComment.id]: !pre[parentComment.id] }))}
            role="button"
            aria-label="Reply to Thread"
          >
            <FaRegComment />
          </div>
          <span
            className={styles.shareIcon}
            onClick={() => {
              navigator.clipboard.writeText( `${window.location.origin}/Threads/${parentComment.id}`);
              alert('Post URL copied!');
            }}
            role="button"
            aria-label="Reply Share Comment"
          >
            <FaShareSquare />
          </span>
        </div>
        {openChat[parentComment.id] && (
          <div className={styles.replycomm}>
            <textarea value={textComm[parentComment.id] || ''}
              onChange={event => setReplyText(pre => ({ ...pre, [parentComment.id]: event.target.value,}))}
              placeholder="Write your reply . . ."
            />
            <div className={styles.replyButtons}>
              <button onClick={() => handlePostComment(parentComment.id)}
                disabled={!textComm[parentComment.id]?.trim()}
              >
                Post Reply
              </button>
              <button onClick={() => onCancel(pre => ({...pre, [parentComment.id]: false,}))}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.threadCon}>
        {parentComment.replies?.map((reply) => renCommTree(reply, 1, parentComment.username))}
      </div>
    </div>
  );
}
