
import styles from './Profile.module.scss';
import React, { useEffect, useState } from "react";
import defaultAvatar from '../../assets/default-avatar.png';
import food from '../../assets/food.jpg';

interface authedUser {
  username: string;
  bio?: string;
  profileImage?: string;
  comments?: string[];
}

interface Post {
  parent_id: string;
  id: string;
  creator_id: string;
  images: string[];
  body: string; 
  deleted: boolean;
  date: string; 
  likes: number;
  // rating: number; // rating out of 10?
  replies: Post[];
}
{/* later we will make get request on pageload*/}
// const testPosts: Post[] = [ 
//   {parent_id: "1", id: "1", creator_id: "user1", images: [food], body: "This is a comment", likes: 10, deleted: false, date: "2023-10-01", replies: []},
//   {parent_id: "1", id: "2", creator_id: "user2", images: [], body: "comment without an image", likes: 5, deleted: false, date: "2023-10-02", replies: []},
//   {parent_id: "1", id: "3", creator_id: "user3", images: [food], body: "comment with an image", likes: 2, deleted: false, date: "2023-10-03", replies: []},
// ];

const mockPosts: Post[] = [
  {
    parent_id: "0",
    id: "1",
    creator_id: "user_001",
    images: [food],
    body: "top level comment (post)",
    deleted: false,
    date: "2025-05-29T12:30:00Z",
    likes: 0,
    replies: [
      {
        parent_id: "1",
        id: "2",
        creator_id: "user_002",
        images: [food],
        body: "top level reply 1",
        deleted: false,
        date: "2025-05-29",
        likes: 5,
        replies: [
          {
            parent_id: "2",
            id: "3",
            creator_id: "user_003",
            images: [],
            body: "unshown reply",
            deleted: false,
            date: "2025-05-29",
            likes: 0,
            replies: []
          }
        ]
      },
      {
        parent_id: "1",
        id: "4",
        creator_id: "user_004",
        images: [food],
        body: "top level reply 2",
        deleted: false,
        date: "2025-05-29",
        likes: 30,
        replies: []
      }
    ]
  },
  {
    parent_id: "0",
    id: "5",
    creator_id: "user_005",
    images: [],
    body: "other top level comment text only",
    deleted: false,
    date: "2025-05-29",
    likes: 80,
    replies: [
      {
        parent_id: "5",
        id: "6",
        creator_id: "user_006",
        images: [],
        body: "top level reply 1",
        deleted: false,
        date: "2025-05-29",
        likes: 25,
        replies: [
          {
            parent_id: "6",
            id: "7",
            creator_id: "user_007",
            images: [],
            body: "dont show",
            deleted: false,
            date: "2025-05-29",
            likes: 15,
            replies: []
          }
        ]
      }
    ]
  }
];


//     parent_id: str
//     id: str
//     creator_id: str
//     images: list[str] # List of image IDs
//     body: str
//     likes: int
//     deleted: bool
//     date: str
//     replies: list['Comment']

const Profile = () => {
  const [posts, setImagePosts] = useState<Post[]>(mockPosts.filter(post => post.images.length > 0));
  const [textPosts, setTextPosts] = useState<Post[]>(mockPosts.filter(post => post.images.length === 0));
  const [username, setUsername] = useState("tempuser");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(["in n out", "mcdonalds"]);
  const [profileImage, setProfileImage] = useState();
  const [followers] = useState(2);
  const [following] = useState(1);

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
    fetch('/api/v1/authed-user') // api endpoint but not complete yet?
    .then(response => response.json())
    .then(async (user) => {
      setUsername(user.username);
      setBio(user.bio || "");
      setProfileImage(user.profileImage || defaultAvatar); // maybe refactor this later but right now probably works
      if (user.comments && user.comments.length > 0){
        const commentList = user.comments.map((id : string) => {
          fetch(`/api/v1/comment/${id}`)
          .then(response => response.json())
        });
        let comments = await Promise.all(commentList);
        comments = comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const imagePosts = comments.filter(post => post.images.length > 0 && !post.deleted);
        const textPosts = comments.filter(post => post.images.length === 0 && !post.deleted);
        setImagePosts(imagePosts);
        setTextPosts(textPosts);
      }
    })
  });

  function countReplies(comment: Post){
    let count = 0;
    const countRecursive = (c: Post) => {
      count++;
      c.replies.forEach(reply => countRecursive(reply));
    };
    countRecursive(comment);
    return count - 1;
  }

  // RATHER THAN RECURSIVELY RENDERING, REDIRECT TO RESTAURANT PAGE

  // const CommentComponent = ({comment} : {comment: Post}) => {
  //   return (
  //     <div>
  //     {comment.deleted ? (
  //       <div>[Deleted comment]</div>
  //     ) : (
  //       <div>
  //       <strong>{comment.creator_id}:</strong>
  //       <p>{comment.body}</p>
  //       {comment.images?.length > 0 && (
  //         <div>
  //           {comment.images.map((base64Img, i) => (
  //             <img 
  //               key={i}
  //               src={`data:image/jpeg;base64,${base64Img}`} 
  //               alt={`Comment image ${i + 1}`}
  //             />
  //           ))}
  //         </div>
  //       )}
  //       </div>
  //     )}
  //     {comment.replies.length > 0 && (
  //       <div>
  //         {comment.replies.map((reply) => (
  //           <CommentComponent key={reply.id} comment={reply} />
  //         ))}
  //       </div>
  //     )}
  //   </div>
  //   );
  // }

  /* function that, given an array of Post objects (replies to a comment), will render the top level ones */
  function ReplyList({ replies }: { replies: Post[] }) {
    if (!replies || replies.length === 0) {
      return <div>No comments yet, be the first to comment!</div>;
    }
    return (
      <div>
        {replies.map(reply => (
          <div key={reply.id} className={styles.reply}>
            <div>{reply.creator_id} at {reply.date}</div>
            <div className={styles.replyImages}>
              {reply.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={reply.body}
                  style={{width: '50px', height: '50px', marginRight: '8px'}}
                />
              ))}
            </div>
            <span className={styles.replyBody}>{reply.body}</span>
            <button onClick={() => fetch(`/api/v1/comment/${reply.id}/add_like`)}>Like</button>
            <span>{reply.likes}</span>
            <br></br>
            {reply.replies.length > 0 && <button onClick={() => { fetch(`/api/v1/comment/${reply.id}/`) }}>See more replies...</button>}
            {/*eventually need endpoint for restaurant page that we will get redirected to + issue: we lose the comment we were tracking*/}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
    {/* user info */}
    <section style={{textAlign: 'center',}}>
      <img src={defaultAvatar} alt="Profile picture" width={100} height={100} />
      {isEditing ? (
        <div>
          <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} rows={3} style={{width: "100%", marginBottom: "8px"}}/>
          <br/>
          <button onClick={saveProfile}>Save</button>
          <button onClick={cancelEdit} style={{marginLeft: "8px"}}>Cancel</button>
        </div>
      ) : (
        <div>
          <h2>{username}</h2>
          <p>{bio}</p>
          <p>
            Followers: {followers} | Following: {following}
          </p>
          <button onClick={editProfile}>Edit Profile</button>
          <button style={{marginLeft: "8px"}} onClick={() => setFavoritesOpen(true)}>Favorites</button>
        </div>
      )}
    </section>

    {/* comments and posts collection */}
      <section>
        <h3 style={{textAlign: 'center'}}>Your Comments</h3>
        {posts.length === 0 ? (<p>No posts yet.</p>) : 
        (
        <div className={styles.galleryGrid}> 
          {posts.map((post) => ( 
            <div className={styles.galleryImageWrapper} key={post.id}>
              <img 
                src={post.images[0]}
                alt={post.body}
                className={styles.galleryImage}
                onClick={() => setSelectedPost(post)}
              />
            </div>
          ))}
        </div>
        )}
        {/* shows all the top level comments with images in a gallery format */}
        {selectedPost && ( /* FIX THIS PART TO SHOW ALL THE IMAGES IN THE ARRAY */
        <div className={styles.popupOverlay} onClick={() => setSelectedPost(null)}> 
          <div className={styles.popupContent} onClick={e => e.stopPropagation()}>
            <img src={selectedPost.images[0]} alt={selectedPost.body} style={{width: '100%', borderRadius: '8px'}} />
            <div className={styles.popupRightSide}> 
              <div className={styles.mainComment}>
                <p>{selectedPost.body}</p> 
              </div>
              <div className={styles.commentsSection}> 
                <ReplyList replies={selectedPost.replies}/>
              </div>
              <div className={styles.commentInfo}>         
                <p>Likes: {selectedPost.likes} | Comments: {countReplies(selectedPost)} {/* should be total tree size */}</p>
                <button onClick={() => { deletePost(selectedPost.id); setSelectedPost(null); }}>Delete Post</button>
                <button onClick={() => setSelectedPost(null)} style={{marginLeft: "8px"}}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.textPostsSection}>
        <h3>Text Posts</h3>
        {textPosts.length > 0 ? (
          textPosts.map(post => (
            <div key={post.id} className={styles.textPost}>
              <p>{post.creator_id} at {post.date}</p>
              <p>{post.body}</p>
              <div style={{paddingLeft: 8}}>
                <ReplyList replies={post.replies} />
              </div>
            </div>
          ))
        ) : (
          <p>No text-only posts yet.</p>
        )}
      </div>
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

