
import styles from './Profile.module.scss';
import React, { useContext, useEffect, useState } from "react";
import defaultAvatar from '../../assets/default-avatar.png';
import food from '../../assets/food.jpg';
import placeholder from '../../assets/image2vector.svg';
import { mockResturantsData } from '../../api_data/mock_data';
import { mockPublish } from '../../api_data/mock_data';
import { type CommentId, type Restaurant } from '../../interface_data/index.ts';
import { type Comment } from '../../interface_data/index.ts';
import { type User } from '../../interface_data/index.ts';
import { getRestaurantsMock, getCommentsMock  } from '../../api_data/client.ts';
import { useNavigate } from 'react-router-dom';
import { FaTh, FaHeart, FaRegComment, FaShareSquare, FaComment} from "react-icons/fa";
import { GlobalStateContext } from '../../global_state/global_state.ts';

interface Post extends Comment{
  totalReplies?: number;
}
// export interface Comment { 
//     id: string;
//     username: string;
//     body: string;
//     images: Base64Data[];
//     likes: number;
//     deleted: boolean;
//     replies: Comment[];
//     restaurantId?: string;
// }

// export interface User {
//     username: string;
//     profileImage: Base64Data;
//     bio: string;
//     comments: CommentId[];
// }


const mockPosts: Post[] = [
  {
    id: "1",
    username: "user_001",
    images: [food],
    body: "top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)",
    deleted: false,
    rating: 9,
    likes: 0,
    replies: [
      {
        id: "2",
        username: "user_002",
        images: [food],
        body: "top level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with repliestop level reply 1 with replies",
        deleted: false,
        likes: 5,
        replies: [
          {
            id: "3",
            username: "user_003",
            images: [],
            body: "unshown reply",
            deleted: false,
            likes: 0,
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
    replies: []
    },
    {id: "20",
    username: "user_001",
    images: [food],
    body: "top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)top level comment (post)",
    deleted: false,
    rating: 9,
    likes: 0,
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
    replies: [
      {
        id: "6",
        username: "user_006",
        images: [],
        body: "top level reply 1 with replies",
        deleted: false,
        likes: 25,
        replies: [
          {
            id: "7",
            username: "user_007",
            images: [],
            body: "dont show",
            deleted: false,
            likes: 15,
            replies: []
          }
        ]
      }
    ]
  }
];


const Profile = () => {
  console.log('Component rendering');
  const [posts, setImagePosts] = useState<Post[]>(mockPosts);
  // const [textPosts, setTextPosts] = useState<Post[]>(mockPosts.filter(post => post.images.length === 0));
  const [username, setUsername] = useState("tempuser");
  const [bio, setBio] = useState("testbio");
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(["in n out", "mcdonalds"]);
  const [profileImage, setProfileImage] = useState<string>();
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const  globalState = useContext(GlobalStateContext)
  const [userAuthenticationState, setUserAuthenticationState] = globalState!.userAuthState;
  const [followers] = useState(2);
  const [following] = useState(1);

  const navigate = useNavigate();

  function editProfile() {
    setIsEditing(true);
  }
  function cancelEdit() {
    setIsEditing(false);
  }
  // we need the setTempuserName and setTempBio stuff so it doesn't save if we want to cancel: intermediate values
  function saveProfile() {
    setBio(tempBio);
    setIsEditing(false);
  }
  function deletePost(id: string) { // FIX THIS CALL API DELETE
    setImagePosts(posts.filter((post) => post.id !== id));
    fetch(`/api/v1/comment/${id}`, {method: 'DELETE'});
  }

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
          
          const topLevelComments = comments.filter(comment => comment.rating !== undefined && !comment.deleted);
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
    }
    
  }, [globalState!.userAuthState[0]]); // run this effect when the user changes
  //   .catch(error => console.error('Fetch error:', error));
  // }, []);

      // const topLevelComments = user.comments.filter((comment: Post) => comment.rating !== undefined);
    // const commentList = topLevelComments.map(async (comment: Post) => {
    //   const response = await fetch(`/api/v1/comment/${comment.id}`);
    //   return await response.json();
    // });
    // let comments = await Promise.all(commentList);
    
    // const imagePosts = comments.filter(post => !post.deleted).map(post => ({
    // ...post, 
    // images: post.images?.length > 0 ? post.images : [/*placeholder*/]
    // }));
    // // const textPosts = comments.filter(post => post.images.length === 0 && !post.deleted);
    // setImagePosts(imagePosts);
    // // setTextPosts(textPosts);

  for (const post of posts) {
  post.totalReplies = countReplies(post);
  } 

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
                  <button className={styles.likeButton} onClick={() => fetch(`/api/v1/comment/${reply.id}/add_like`)}><FaHeart size=".9rem"/></button>
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
  return (
    <div className={styles.profile}>
    {/* user info */}
    <section style={{textAlign: 'center',}}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: 30}}>
        <img src={profileImage} alt="Profile picture" width={150} height={150} style={{marginRight: 20}}/>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 'fit-content'}}>
            <p className={styles.username}>{username}</p>
          </div>
          <div style={{textAlign: 'left'}}>
            <p>
              <span className={styles.postsCount}><strong>{posts.length}</strong> Posts</span> 
            </p>
          </div>
        </div>
      </div>
      {isEditing && (
        <div>
          <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={3} style={{width: "50%", marginBottom: "8px"}}/>
          <br/>
          <div style={{display: 'flex', flexDirection: 'row'}}>          
            <button onClick={saveProfile}>Save</button>
            <button onClick={cancelEdit} style={{marginLeft: "8px"}}>Cancel</button>
          </div>
        </div>
      )}
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
                {/* <p>Likes: {selectedPost.likes} | Comments: {selectedPost.totalReplies} </p> */}
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
      {favoritesOpen && (
        <div className={styles.popupOverlay} onClick={() => setFavoritesOpen(false)}>
          <div className={styles.popupContent} style={{flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <h3>My Favorite Restaurants</h3>
            <ul style={{listStyleType: 'none', paddingLeft: 0}}>
              {favorites.map((restaurant, index) => (
                <li key={index}>{restaurant}</li>
              ))}
            </ul>
            <button onClick={() => setFavoritesOpen(false)}>Close</button>
        </div>
      </div>
      )}
    </div>
  );
};

export default Profile;

// interface Post extends Comment{
//   rating: number;
// }

// interface User {
//   username: string;
//   bio?: string;
//   profileImage?: string;
//   comments?: string[];
// }

// interface Post {
//   `````````````````parent_id`````````````````: string;
//   id: string;
//   username: string;
//   images: string[];
//   body: string; 
//   deleted: boolean;
//   date: string; 
//   likes: number;
//   // rating: number; // rating out of 10?
//   replies: Post[];
// }
{/* later we will make get request on pageload*/}
// const testPosts: Post[] = [ 
//   {parent_id: "1", id: "1", username: "user1", images: [food], body: "This is a comment", likes: 10, deleted: false, date: "2023-10-01", replies: []},
//   {parent_id: "1", id: "2", username: "user2", images: [], body: "comment without an image", likes: 5, deleted: false, date: "2023-10-02", replies: []},
//   {parent_id: "1", id: "3", username: "user3", images: [food], body: "comment with an image", likes: 2, deleted: false, date: "2023-10-03", replies: []},
// ];




//     parent_id: str
//     id: str
//     username: str
//     images: list[str] # List of image IDs
//     body: str
//     likes: int
//     deleted: bool
//     date: str
//     replies: list['Comment']

//NEED:
// - delete endpoint
// - like endpoint
// - list of liked comments (so we know whether the heart should be filled or not)