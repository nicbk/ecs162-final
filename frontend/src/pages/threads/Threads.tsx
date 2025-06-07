import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type Comment } from '../../interface_data/index.ts';
import { getComments } from '../../api_data/client.ts';
import { FaHeart, FaShareSquare } from 'react-icons/fa';
import styles from './Threads.module.scss';

export default function Threads() {
  const { commentId } = useParams<{ commentId: string }>();
  const [comments, setComm] = useState<Comment[]>([]);
  const [ParentComm, SetParentComm] = useState<Comment | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const commData = await getComments();
        setComm(commData);
      } catch (error) {
        console.error('Failed to load comments', error);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!commentId) {
      SetParentComm(null);
      return;
    }
    const found = comments.find((comm) => comm.id === commentId) ?? null;
    SetParentComm(found);
  }, [comments, commentId]);

  const togLike = (id: string) => {
    setLiked((pre) => ({ ...pre, [id]: !pre[id] }));
  };

  const togExp = (id: string) => {
    setExpanded((pre) => ({ ...pre, [id]: !pre[id] }));
  };

  function renCommTree(comment: Comment, level = 1, parentUsername?: string)
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
              liked[comment.id] ? styles.liked : ''
            }`}
            onClick={() => togLike(comment.id)}
          >
            <FaHeart />
          </span>
          <span
            className={styles.shareIcon}
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/threads/${comment.id}`
              );
              alert('Post URL copied!');
            }}
          >
            <FaShareSquare />
          </span>
        </div>

        {comment.replies?.length > 0 && (
          <div className={styles.showMore}>
            <button onClick={() => togExp(comment.id)}>
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
  if (!ParentComm) {
    return <p>Sorry, No Comment found.</p>;
  }

  return (
    <div className={styles.threads}>
      <div className={ `${styles.commCard} ${styles.pComm}`}>
        <div className={styles.threadHeader}>
          <strong>{ParentComm.username}</strong>
        </div>

        <div className={styles.descripModel}>
          <p>{ParentComm.body}</p>
        </div>
        
        {ParentComm.images?.length > 0 && (
          <div className={styles.commimgs}>
            {ParentComm.images.map((img, num) => (<img key={num} src={img} alt={`Post Image ${num + 1}`} />))}
          </div>
        )}
        <div className={styles.commFoot}>
          <span className={ `${styles.likeIcon} ${ liked[ParentComm.id] ? styles.liked : ''}`}
            onClick={() => togLike(ParentComm.id)}
          >
            <FaHeart />
          </span>
          <span
            className={styles.shareIcon}
            onClick={() => {
              navigator.clipboard.writeText( `${window.location.origin}/threads/${ParentComm.id}`);
              alert('Post URL copied!');
            }}
          >
            <FaShareSquare />
          </span>
        </div>
      </div>

      <div className={styles.threadCon}>
        {ParentComm.replies?.map((reply) => renCommTree(reply, 1, ParentComm.username))}
      </div>
    </div>
  );
}
