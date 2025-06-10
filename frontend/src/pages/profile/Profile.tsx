
import styles from './Profile.module.scss';
import { useContext, useEffect, useState } from "react";
import defaultAvatar from '../../assets/default-avatar.png';
import food from '../../assets/food.jpg';
import placeholder from '../../assets/image2vector.svg';
import { isCommentTopLevel, type CommentId, type Comment } from '../../interface_data/index.ts';
import { addLike, deleteComment } from '../../api_data/client.ts'
import { type User } from '../../interface_data/index.ts';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaComment} from "react-icons/fa";
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';

interface Post extends Comment{
  totalReplies?: number;
}

/*
const mockPosts: Post[] = [
  {
    id: "1",
    username: "user_001",
    images: [food],
    body: "top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)",
    deleted: false,
    rating: 9,
    likes: 0,
    parentId: '10',
    replies: [
      {
        id: "2",
        username: "user_002",
        images: [food],
        body: "top level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with replies",
        deleted: false,
        likes: 5,
        rating: 0,
        parentId: '10',
        replies: [
          {
            id: "3",
            username: "user_003",
            images: [],
            body: "unshown reply",
            deleted: false,
            likes: 0,
            rating: 0,
            parentId: '10',
            replies: []
          }
        ]
      },
      {
        id: "4",
        username: "user_004",
        images: [],
        body: "top level reply 2 no replies",
        deleted: false,
        likes: 30,
        rating: 0,
        parentId: '10',
        replies: []
      }
    ]
  },
  {id: "19",
    username: "user_001",
    images: [food],
    body: "top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)",
    deleted: false,
    rating: 9,
    likes: 0,
        parentId: '10',
    replies: []
    },
    {id: "20",
    username: "user_001",
    images: [food],
    body: "top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)",
    deleted: false,
    rating: 9,
    likes: 0,
    parentId: '10',
    replies: []
    },
  {
    id: "5",
    username: "user_005",
    images: [placeholder],
    body: "other top level comment text only",
    deleted: false,
    rating: 1,
    likes: 80,
        parentId: '10',
    replies: [
      {
        id: "6",
        username: "user_006",
        images: [],
        body: "top level reply 1 with replies",
        deleted: false,
        likes: 25,
                rating: 0,
        parentId: '10',
        replies: [
          {
            id: "7",
            username: "user_007",
            images: [],
            body: "dont show",
            deleted: false,
            likes: 15,
                    rating: 0,
        parentId: '10',
            replies: []
          }
        ]
      }
    ]
  }
];
*/

const Profile = () => {
  console.log('Component rendering');
  const [loading, setLoading] = useState(true);
  const [posts, setImagePosts] = useState<Post[]>([]);
  const [username, setUsername] = useState("tempuser");
  const [width, setWidth] = useState(window.innerWidth);
  const [, setBio] = useState("testbio");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [profileImage, setProfileImage] = useState<string>();
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const  globalState = useContext(GlobalStateContext)
  const [userAuthenticationState, setUserAuthenticationState] = globalState!.userAuthState;
  console.log(userAuthenticationState)

  const navigate = useNavigate();

  function deletePost(id: string) { 
    setImagePosts(posts.filter((post) => post.id !== id));
    deleteComment(id);
  }

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log('fetching user data');
    const user = globalState!.userAuthState[0] as User;
    setUsername(user.username);
    console.log('name changed to', user.username);
    setBio(user.bio || "");
    console.log('bio changed to', user.bio);
    setProfileImage(user.profileImage || defaultAvatar); 
    if (user.comments && user.comments.length > 0){
      const fetchComments = async () => {
        try {
          const commentFetches = user.comments.map(async (commentId: CommentId) => {
            const response = await fetch(`/api/v1/comment/${commentId}`);
            return await response.json() as Comment;
          });
          const comments = await Promise.all(commentFetches);

          const topLevelComments = comments.filter(comment => isCommentTopLevel(comment) && !comment.deleted);
          const imagePosts = topLevelComments.map(comment => ({
            ...comment,
            images: comment.images.length > 0 ? comment.images : [placeholder],
          }));
          setImagePosts(imagePosts);
          setLoading(false);
        } 
        catch (err) {
          console.error('Error fetching comments:', err);
        }
      }
      fetchComments();
    }
  }, [globalState!.userAuthState[0]]); // run this effect when the user changes

  function countReplies(comment: Post){
    let count = 0;
    const countRecursive = (c: Post) => {
      count++;
      c.replies.forEach(reply => countRecursive(reply));
    };
    countRecursive(comment);
    return count - 1;
  }

  /* function that, given an array of Post objects (replies to a comment), will render the top level ones */
  function ReplyList({ replies }: { replies: Post[] }) {
    if (!replies || replies.length === 0) {
      return <div>No replies yet!</div>;
    }
    return (
      <div>
        {replies.map(reply => (
          <div key={reply.id} className={styles.reply}>
            <div style={{marginBottom:4, display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <span><strong>{reply.username}</strong></span>
              <span style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>
              
              </span>
            </div>
            <div style={{marginLeft:8}}>
              {reply.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={reply.body}
                  style={{width: '50px', height: '50px', marginRight: '8px'}}
                />
              ))}
            </div>
            <div style={{marginLeft:8, display: 'flex', flexDirection: 'column'}}>
              {reply.body}
              <strong>
                <span className={styles.likeCount}>
                  <button className={styles.likeButton} onClick={() => addLike(reply.id)}><FaHeart size=".9rem"/></button>
                <span style={{marginLeft: 6, marginTop: 5}}>
                    {reply.likes} likes 
                    <a className={styles.replyLink} onClick={() => navigate(`Threads/${reply.id}`)}>Reply</a> {/* redirect to threads */}
                  </span>
                </span>
              </strong>
            </div>
            {reply.replies.length > 0 && (
              <div className={styles.moreReplies} onClick={() => navigate(`Threads/${reply.id}`)}>
                <span style={{marginTop:8, marginRight:15}} className={styles.line}></span>
                <span>See more replies ({reply.replies.length})</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingSpinner />
    )
  }

  for (const post of posts) {
    post.totalReplies = countReplies(post);
  } 

  const full = width >= 1200;
  const tablet = width < 1200 && width >= 768;
  const mobile = width < 768;
  return (
    <div className={styles.profile}>
    {/* user info */}
    <section style={{textAlign: 'center',}}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 30}}>
        <img src={profileImage} alt="Profile picture" width={125} height={125} style={{marginRight: 20, borderRadius: '50%'}}/>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 'fit-content'}}>
            <p className={styles.username}>{username}</p>
          </div>
          {/* <p>{bio}</p> */}
          <div style={{textAlign: 'left'}}>
            <p>
              <span className={styles.postsCount}><strong>{posts.length}</strong> Posts</span> 
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* comments and posts collection */}
      <section>
        <div className={styles.separator}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <h3 className={styles.posts}>Posts</h3>
        </div>
        {posts.length === 0 ? (<p>No posts yet.</p>) : 
        (
        <div className={styles.galleryGrid}> 
          {posts.map((post) => ( 
            <div className={styles.galleryImageWrapper} 
            key={post.id}
            onMouseEnter={() => setHoveredPostId(post.id)}
            onMouseLeave={() => setHoveredPostId(null)}>
              <img 
                src={post.images[0]}
                alt={post.body}
                className={styles.galleryImage}
                onClick={() => setSelectedPost(post)}
              />
              {hoveredPostId === post.id && (
              <div className={styles.hoverOverlay}>
                <div style={{display: 'flex', gap:32, alignItems: 'center'}}>
                  <span className={styles.likesHover}><FaHeart size="1.3rem"/> {post.likes}</span>
                  <span className={styles.likesHover}><FaComment size="1.3rem"/> {post.totalReplies}</span>
                </div>
              </div>
              )}
            </div>
          ))}
        </div>
        )}
        {/* shows all the top level comments with images in a gallery format */}
        {selectedPost && (
        <div className={styles.popupOverlay} onClick={() => setSelectedPost(null)}> 
          <div className={styles.popupContent} onClick={e => e.stopPropagation()}>
            <div className={styles.imageWrapper}>
              <img src={selectedPost.images[0]} alt={selectedPost.body} style={{width: '100%', borderRadius: '8px'}} />
              {(tablet || mobile) && (<div className={styles.mainComment}>
                <p>{selectedPost.body}</p>
              </div>)}
            </div>
            <div className={styles.popupRightSide}> 
              {full && (
                <div className={styles.mainComment}>
                  <p>{selectedPost.body}</p> 
                </div>)}
              <div className={styles.commentsSection}> 
                <ReplyList replies={selectedPost.replies}/>
              </div>
              <div className={styles.commentInfo}>
                <div style={{display: 'flex', flexDirection: 'row'}}> 
                  <button onClick={() => { deletePost(selectedPost.id); setSelectedPost(null); }}>Delete Post</button>
                  <button onClick={() => setSelectedPost(null)} style={{marginLeft: "8px"}}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
};

export default Profile;