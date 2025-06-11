
import styles from './Profile.module.scss';
import { useContext, useEffect, useState } from "react";
import defaultAvatar from '../../assets/default-avatar.png';
import placeholder from '../../assets/image2vector.svg';
import { isCommentTopLevel, type CommentId, type Comment, type GoogleApiRestaurantResponse } from '../../interface_data/index.ts';
import { deleteComment, getCommentTree, getRestaurantById } from '../../api_data/client.ts'
import { type User } from '../../interface_data/index.ts';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaComment, FaChevronDown} from "react-icons/fa";
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
import { useWishListRestaurants } from '../../global_state/user_hooks.ts';
import { useToggleLike } from '../../global_state/comment_hooks.ts';

interface Post extends Comment{
  totalReplies?: number;
}


const Profile = () => {
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
  const [isFetched, setIsFetched] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [refreshLikes, setRefreshLikes] = useState(0);
  const [replies, setReplies] = useState<Post[]>([]); 
  const [restaurants, setRestaurants] = useState<GoogleApiRestaurantResponse[]>([]);

  const navigate = useNavigate();
  const toggleLikes = useToggleLike();

  function deletePost(id: string) { 
    setImagePosts(posts.filter((post) => post.id !== id));
    deleteComment(id);
  }

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const wishlistIds = useWishListRestaurants();

  useEffect(() => {
    if (wishlistIds && wishlistIds.length > 0) {
      Promise.all(
        wishlistIds.map(id => getRestaurantById(id))
      )
      .then(results => {
        setRestaurants(results);
      });
    } 
    else {
      setRestaurants([]);
    }
  }, [wishlistIds]);

  const user = globalState!.userAuthState[0] as User;

  useEffect(() => {
    setUsername(user.username);
    setBio(user.bio || "");
    setProfileImage(user.profileImage || defaultAvatar); 
    if (user.comments && user.comments.length > 0){
      const fetchComments = async () => {
        try {
          const commentFetches = user.comments.map(async (commentId: CommentId) => {
            const response = await getCommentTree(commentId);
            return response;
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
    } else {
      setLoading(false);
    }
  }, [globalState!.userAuthState[0], user.comments]); // run this effect when the user changes

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
  function ReplyList({ parentId, replies, toggleLikes }: { parentId: string, replies: Post[], toggleLikes: (parentId: string, replyId: string) => void }) {

    if (!replies || replies.length === 0) {
      return <div>No replies yet!</div>;
    }
    return (
      <div>
        {replies.map(reply => (
          <div key={reply.id} className={styles.commentItem}>
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
                  <button className={styles.likeButton} onClick={() => {
                    toggleLikes(parentId, reply.id);
                  }}>
                    <FaHeart size=".9rem"/>
                    </button>
                <span style={{marginLeft: 6, marginTop: 5}}>
                    {reply.likes} likes 
                    <a className={styles.replyLink} onClick={() => navigate(`/Threads/${reply.id}`)}>Reply</a> {/* redirect to threads */}
                  </span>
                </span>
              </strong>
            </div>
            {reply.replies.length > 0 && (
              <div className={styles.moreReplies} onClick={() => navigate(`/Threads/${reply.id}`)}>
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

 

//   const wishlist: Restaurant[] = [
//   {
//     restaurantId: "1",
//     restaurantTitle: "restaurant1",
//     rating: 4.5,
//     address: "",
//     images: [],
//     googleMapsUrl: ""
//   },
//   {
//     restaurantId: "2",
//     restaurantTitle: "restaurant2",
//     rating: 4.8,
//     address: "",
//     images: [],
//     googleMapsUrl: ""
//   }
// ];

  return (
    <div className={styles.profile}>
    {/* user info */}
    <section style={{textAlign: 'center',}}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 30}}>
        <img src={profileImage} alt="Profile picture" width={125} height={125} style={{marginRight: 20, borderRadius: '50%'}}/>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 'fit-content'}}>
            <p className={styles.username}>{username}</p>
            <div style={{position: 'relative'}}>
              <div className={styles.wishlistDropdown}>
                <button className={styles.wishlistButton} onClick={() => setWishlistOpen(!wishlistOpen)}>
                  My Wishlist <FaChevronDown style={{ transform: wishlistOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}} />
                </button>
                {wishlistOpen && (
                  <div className={styles.dropdownMenu}>
                  {restaurants.length > 0 ? (
                    restaurants.map(restaurant => (
                      <div key={restaurant.id} className={styles.wishlistItem}>
                        <span>{restaurant.displayName}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{padding: '8px 16px'}}>Your wishlist is empty!</div>
                  )}
                </div>
                )}
              </div>
            </div>
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
        {posts.length === 0 ? (
          <div className={styles['no-posts-msg-container']}>
            <p className={styles['no-posts-msg']}>No posts yet.</p>
          </div>) : 
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
                  <h2>{selectedPost.body}</h2> 
                </div>)}
              <div className={styles.commentsSection}> 
                <ReplyList parentId={selectedPost.id} replies={selectedPost.replies} toggleLikes={toggleLikes}/>
              </div>
              <div className={styles.commentInfo}>
                <div style={{display: 'flex', flexDirection: 'row', fontSize: 'rerem'}}> 
                  <button onClick={() => { deletePost(selectedPost.id); setSelectedPost(null); }} className={styles.commentInfoButton}>Delete Post</button>
                  <button onClick={() => setSelectedPost(null)} className={styles.commentInfoButton}>Close</button>
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