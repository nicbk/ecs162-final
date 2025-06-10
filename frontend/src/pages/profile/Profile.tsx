
import styles from './Profile.module.scss';
import { useContext, useEffect, useState } from "react";
import defaultAvatar from '../../assets/default-avatar.png';
import food from '../../assets/food.jpg';
import placeholder from '../../assets/image2vector.svg';
import { isCommentTopLevel, type CommentId, type Comment } from '../../interface_data/index.ts';
import { addLike, deleteComment } from '../../api_data/client.ts'
import { type User, type Restaurant } from '../../interface_data/index.ts';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaComment, FaChevronDown} from "react-icons/fa";
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
// import { useLikedRestaurants } from '../../global_state/user_hooks.ts';

interface Post extends Comment{
  totalReplies?: number;
}

const mockPosts: Post[] = [];


const Profile = () => {
  console.log('Component rendering');
  const [posts, setImagePosts] = useState<Post[]>(mockPosts);
  const [username, setUsername] = useState("tempuser");
  const [, setBio] = useState("testbio");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [profileImage, setProfileImage] = useState<string>();
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const  globalState = useContext(GlobalStateContext)
  const [userAuthenticationState, setUserAuthenticationState] = globalState!.userAuthState;
  const [isFetched, setIsFetched] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  console.log(userAuthenticationState)

  const navigate = useNavigate();

  function deletePost(id: string) { 
    setImagePosts(posts.filter((post) => post.id !== id));
    deleteComment(id);
  }

  const user = globalState!.userAuthState[0] as User;

  useEffect(() => {
    console.log('fetching user data');

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
            console.log(`Response status for ${commentId}:`, response.status);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            
            // return await response.json() as Comment;
            let result = await response.json();
            console.log(`Data for ${commentId}:`, result);
            return result;
          });
          const comments = await Promise.all(commentFetches);

          const topLevelComments = comments.filter(comment => isCommentTopLevel(comment) && !comment.deleted);
          const imagePosts = topLevelComments.map(comment => ({
            ...comment,
            images: comment.images.length > 0 ? comment.images : [placeholder],
          }));
          setImagePosts(imagePosts);
        } 
        catch (err) {
          console.error('Error fetching comments:', err);
        }
      }
      fetchComments();
      setIsFetched(true);
    }
  }, [globalState!.userAuthState[0], user.comments]); // run this effect when the user changes

  for (const post of posts) {
  post.totalReplies = countReplies(post);
  } 

  function countReplies(comment: Post){
    let count = 0;
    const countRecursive = (c: Post) => {
      count++;
      (c.replies || []).forEach(reply => countRecursive(reply));
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
              {reply.images && reply.images.length > 0 && reply.images.map((img, idx) => (
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
            {reply.replies && reply.replies.length > 0 && (
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

  function windowWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
}
  const width = windowWidth();
  const full = width >= 1200;
  const tablet = width < 1200 && width >= 768;
  const mobile = width < 768;

  // const wishlist = useLikedRestaurants();

  const wishlist: Restaurant[] = [
  {
    restaurantId: "1",
    restaurantTitle: "restaurant1",
    rating: 4.5,
    address: "",
    images: [],
    googleMapsUrl: ""
  },
  {
    restaurantId: "2",
    restaurantTitle: "restaurant2",
    rating: 4.8,
    address: "",
    images: [],
    googleMapsUrl: ""
  }
];

  return (
    <div className={styles.profile}>
    {/* user info */}
    <section style={{textAlign: 'center',}}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 30}}>
        <img src={profileImage} alt="Profile picture" width={125} height={125} style={{marginRight: 20, borderRadius: '50%'}}/>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 'fit-content', position: 'relative'}}>
            <p className={styles.username}>{username}</p>
            <div style={{position: 'relative'}}>
              <div className={styles.wishlistDropdown}>
                <button className={styles.wishlistButton} onClick={() => setWishlistOpen(!wishlistOpen)}>
                  My Wishlist <FaChevronDown style={{ transform: wishlistOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}} />
                </button>
                {wishlistOpen && (
                  <div className={styles.dropdownMenu}>
                    {wishlist.length > 0 ? (
                      wishlist.map(restaurant => (
                        <div key={restaurant.restaurantId} className={styles.wishlistItem}>
                          <span>{restaurant.restaurantTitle}</span>
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
    {isFetched ? (
      <section>
        <div className={styles.separator}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <h3 className={styles.posts}>Posts</h3>
        </div>
        {posts.length === 0 ? (<p>No posts yet...</p>) : 
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
      ) : (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default Profile;